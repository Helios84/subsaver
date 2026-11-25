"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
  LogOut, Plus, BadgeCheck, GraduationCap, Layout, CreditCard,
  Search, SlidersHorizontal, X as XIcon, Menu, Download, Copy,
} from "lucide-react";
import VerificationModal from "../components/VerificationModal";
import StudentDiscountModal from "../components/StudentDiscountModal";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import ServicePickerModal from "../components/ServicePickerModal";
import DashboardEmptyState from "../components/DashboardEmptyState";
import StatsGrid from "../components/dashboard/StatsGrid";
import SubscriptionCard from "../components/dashboard/SubscriptionCard";
import AddSubscriptionPanel from "../components/dashboard/AddSubscriptionPanel";
import EditSubscriptionModal, { type EditState } from "../components/EditSubscriptionModal";
import { loadDashboardSettings, type DashboardSettings } from "../customize/page";
import { useToast } from "../components/ToastProvider";
import OnboardingModal, { shouldShowOnboarding } from "../components/OnboardingModal";
import { getExchangeRates, formatMoney as fxFormat, type Currency } from "../lib/currency";
import { CATEGORIES } from "../lib/categories";
import type { Sub, StudentDiscount, UserOut as User } from "../types/index";
import { monthlyShareCents, displayName } from "../lib/money";

// ─── Local aliases ────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled" | "trial" | "paused";

// CATEGORIES imported from lib/categories (see import above)

function formatMoney(cents: number, currency: import("../lib/currency").Currency, rates: Record<string, number>) {
  return fxFormat(cents, currency, rates);
}

function calculateDaysUntilRenewal(next_billing_date?: string): number | null {
  if (!next_billing_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewalDate = new Date(next_billing_date);
  renewalDate.setHours(0, 0, 0, 0);
  return Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── Core state
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // ── Student discounts
  const [studentDiscounts, setStudentDiscounts] = useState<Map<number, StudentDiscount>>(new Map());
  const [selectedDiscount, setSelectedDiscount] = useState<StudentDiscount | null>(null);
  // Saved so far: months since a cancellation or since a student price was applied
  const [savedToDateCents, setSavedToDateCents] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // ── Dashboard settings (from /customize)
  const [dashSettings, setDashSettings] = useState<DashboardSettings>(loadDashboardSettings);

  // ── Real FX rates for currency conversion
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.93, GBP: 0.79 });

  // ── Analytics data (from /api/dashboard/summary — no separate fetch needed)
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any[]>([]);

  // ── Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ── Show all subscription cards (default: 3 rows = 9 cards)
  const [showAllSubs, setShowAllSubs] = useState(false);
  const CARDS_PER_PAGE = 9; // 3 rows × 3 cols

  useEffect(() => {
    setDashSettings(loadDashboardSettings());
    const onFocus = () => setDashSettings(loadDashboardSettings());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dashboard_settings_v5") setDashSettings(loadDashboardSettings());
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isWidgetEnabled = (id: string) =>
    dashSettings.widgets.find((w) => w.id === id)?.enabled ?? true;

  // ── Autocomplete
  const [allServices, setAllServices] = useState<StudentDiscount[]>([]);
  const [suggestions, setSuggestions] = useState<StudentDiscount[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null); // Click outside

  // ── Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Add form loading state
  const [addingSubscription, setAddingSubscription] = useState(false);

  useEffect(() => {
    apiFetch("/api/student-discounts")
      .then((data) => { if (Array.isArray(data)) setAllServices(data); })
      .catch(() => { /* Non-critical autocomplete — fail silently */ });
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Filter / Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "cancelled">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "date">("date");
  const [showFilters, setShowFilters] = useState(false);

  // ── Add form state
  const [formState, setFormState] = useState({
    name: "",
    price: "9.99",
    cycle: "monthly" as BillingCycle,
    category: "Other",
    billingDate: "",
    isSplit: false,
    splitWith: 1,
  });

  // ── Edit state (now drives modal)
  const [editingSub, setEditingSub] = useState<Sub | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: "",
    price: "0",
    cycle: "monthly",
    status: "active",
    category: "Other",
    billingDate: "",
    isSplit: false,
    splitWith: 1,
  });

  // ── Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Edit saving state
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Fetch on mount
  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) router.push("/login");
    else {
      fetchDashboard();
      // Load real FX rates (now served from backend cache)
      getExchangeRates().then(setFxRates).catch(console.warn);
      // Show onboarding for first-time visitors
      if (shouldShowOnboarding()) setShowOnboarding(true);
    }
  }, [router]);

  // Single summary call instead of 5-6 separate requests
  async function fetchDashboard() {
    setLoading(true);
    try {
      const summary = await apiFetch("/api/dashboard/summary");
      setUser(summary.user);
      setSubs(summary.subscriptions);
      // Analytics data from summary — no extra requests needed
      if (summary.analytics) setAnalyticsData(summary.analytics);
      if (summary.insights)  setInsightsData(summary.insights);
      setSavedToDateCents(summary.savings?.total_saved_to_date ?? 0);
      // Also load student discounts for active subs (skip if user not verified)
      const activeIds = summary.subscriptions
        .filter((s: Sub) => s.status === "active")
        .map((s: Sub) => s.id);
      if (activeIds.length > 0 && summary.user?.is_verified) {
        try {
          const result = await apiFetch("/api/student-discounts/batch-check", {
            method: "POST",
            body: JSON.stringify({ subscription_ids: activeIds }),
          });
          const discountMap = new Map<number, StudentDiscount>();
          for (const [idStr, discount] of Object.entries(result)) {
            if (discount) discountMap.set(Number(idStr), discount as StudentDiscount);
          }
          setStudentDiscounts(discountMap);
        } catch {
          // Non-critical — discounts will just not show
        }
      } else {
        setStudentDiscounts(new Map());
      }
    } catch (err: any) {
      toast(err?.message ?? "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  // Keep fetchSubs for post-mutation refresh (add/edit/delete) — still needed
  async function fetchSubs() {
    try {
      const data = await apiFetch("/subscriptions");
      setSubs(data);
      const ids = data.filter((s: Sub) => s.status === "active").map((s: Sub) => s.id);
      if (ids.length > 0) {
        try {
          const result = await apiFetch("/api/student-discounts/batch-check", {
            method: "POST",
            body: JSON.stringify({ subscription_ids: ids }),
          });
          const discountMap = new Map<number, StudentDiscount>();
          for (const [idStr, discount] of Object.entries(result)) {
            if (discount) discountMap.set(Number(idStr), discount as StudentDiscount);
          }
          setStudentDiscounts(discountMap);
        } catch {
          // Non-critical
        }
      }
    } catch (err: any) {
      toast(err?.message ?? "Failed to reload subscriptions", "error");
    }
  }

  async function addSampleData() {
    toast("Adding sample subscriptions…", "info");
    const sampleSubs = [
      { name: "Spotify",              price_cents: 999,  billing_cycle: "monthly", category: "Entertainment", split_with: 2 },
      { name: "Netflix",              price_cents: 1599, billing_cycle: "monthly", category: "Entertainment", split_with: 4 },
      { name: "Adobe Creative Cloud", price_cents: 5499, billing_cycle: "monthly", category: "Productivity",  split_with: 1 },
      { name: "Xbox Game Pass",       price_cents: 999,  billing_cycle: "monthly", category: "Gaming",        split_with: 1 },
    ];
    try {
      for (const sub of sampleSubs) {
        await apiFetch("/subscriptions", { method: "POST", body: JSON.stringify(sub) });
      }
      await fetchSubs();
      toast("Sample subscriptions added.", "success");
    } catch (err) {
      toast("Could not add the sample subscriptions. Please try again.", "error");
    }
  }

  async function handleApplyDiscount(subscriptionId: number) {
    try {
      await apiFetch(`/api/student-discounts/apply/${subscriptionId}`, { method: "POST" });
      await fetchDashboard();   // price, totals and savings all change
      toast("Student price applied.", "success");
    } catch (err: any) {
      toast(err?.message ?? "Could not apply the student price", "error");
    }
  }

  async function handleRemoveDiscount(sub: Sub) {
    try {
      await apiFetch(`/api/student-discounts/unapply/${sub.id}`, { method: "DELETE" });
      await fetchDashboard();
      toast(`Student price removed from ${sub.name}. The previous price is back.`, "success");
    } catch (err: any) {
      toast(err?.message ?? "Could not remove the student price", "error");
    }
  }

  // Revoke JWT on the backend before clearing localStorage
  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Even if revocation fails, still clear locally
    }
    localStorage.removeItem("subsaver_token");
    router.push("/login");
  }

  // ── Add subscription (loading guard prevents double-submit)
  async function createSub(e: React.FormEvent) {
    e.preventDefault();
    if (addingSubscription) return;
    setAddingSubscription(true);
    try {
      const body: any = {
        name: formState.name.trim(),
        price_cents: Math.max(0, Math.round(Number(formState.price) * 100)),
        billing_cycle: formState.cycle,
        status: "active",
        category: formState.category,
        split_with: formState.isSplit ? formState.splitWith : 1,
      };
      if (formState.billingDate) body.next_billing_date = new Date(formState.billingDate).toISOString();
      await apiFetch("/subscriptions", { method: "POST", body: JSON.stringify(body) });
      setFormState({ name: "", price: "9.99", cycle: "monthly", category: "Other", billingDate: "", isSplit: false, splitWith: 1 });
      toast("Subscription created!", "success");
      fetchSubs();
    } catch (err: any) {
      toast(err?.message ?? "Create failed", "error");
    } finally {
      setAddingSubscription(false);
    }
  }

  async function handleServiceSelect(service: StudentDiscount) {
    setShowServicePicker(false);
    // Added at the regular price; a student price can be applied afterwards.
    const priceToSet = service.regular_price_cents;
    try {
      await apiFetch("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: service.service_name,
          price_cents: priceToSet,
          billing_cycle: "monthly",
          status: "active",
          category: service.category || "Other",
          split_with: 1,
        }),
      });
      await fetchSubs();
      toast(`${service.service_name} added!`, "success");
    } catch (err: any) {
      toast(err?.message ?? "Failed to add subscription", "error");
    }
  }

  const handleNameChange = (val: string) => {
    setFormState((prev) => ({ ...prev, name: val }));
    if (val.length > 1) {
      const filtered = allServices.filter((s) => s.service_name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // ── Edit handlers (now open modal)
  function startEdit(s: Sub) {
    setEditingSub(s);
    setEditState({
      name: s.name,
      price: (s.price_cents / 100).toFixed(2),
      cycle: s.billing_cycle as BillingCycle,
      status: s.status as Status,
      category: s.category || "Other",
      billingDate: s.next_billing_date ? s.next_billing_date.split("T")[0] : "",
      splitWith: s.split_with || 1,
      isSplit: (s.split_with || 1) > 1,
    });
  }

  function cancelEdit() {
    setEditingSub(null);
  }

  async function saveEdit(subId: number) {
    setSavingEdit(true);
    try {
      const body: any = {
        name: editState.name.trim(),
        price_cents: Math.max(0, Math.round(Number(editState.price) * 100)),
        billing_cycle: editState.cycle,
        status: editState.status,
        category: editState.category,
        split_with: editState.isSplit ? editState.splitWith : 1,
      };
      if (editState.billingDate) body.next_billing_date = new Date(editState.billingDate).toISOString();
      const updated = await apiFetch(`/subscriptions/${subId}`, { method: "PATCH", body: JSON.stringify(body) });
      setSubs((prev) => prev.map((s) => (s.id === subId ? updated : s)));
      setEditingSub(null);
      toast("Subscription updated!", "success");
    } catch (err: any) {
      toast(err?.message ?? "Update failed", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function toggleStatus(s: Sub) {
    const next: Status = s.status === "active" ? "cancelled" : "active";
    setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    try {
      const updated = await apiFetch(`/subscriptions/${s.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setSubs((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
      toast(`Subscription ${next === "active" ? "resumed" : "paused"}`, "info");
    } catch (err: any) {
      setSubs((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      toast(err?.message ?? "Toggle failed", "error");
    }
  }

  function confirmDelete(subId: number) {
    setDeletingId(subId);
  }

  function cancelDelete() {
    setDeletingId(null);
  }

  async function executeDelete(subId: number) {
    try {
      await apiFetch(`/subscriptions/${subId}`, { method: "DELETE" });
      setSubs((prev) => prev.filter((s) => s.id !== subId));
      if (deletingId === subId) setDeletingId(null);
      toast("Subscription deleted", "info");
    } catch (err: any) {
      toast(err?.message ?? "Delete failed", "error");
    }
  }

  // ── Filtered & sorted subscriptions
  const filteredSubs = useMemo(() => {
    let result = [...subs];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((s) => s.status === filterStatus);
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter((s) => s.category === filterCategory);
    }

    // Sort
    switch (sortBy) {
      case "name":       result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price_asc":  result.sort((a, b) => a.price_cents - b.price_cents); break;
      case "price_desc": result.sort((a, b) => b.price_cents - a.price_cents); break;
      case "date":       result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }

    return result;
  }, [subs, searchQuery, filterStatus, filterCategory, sortBy]);

  // ── Duplicate subscription
  async function duplicateSub(s: Sub) {
    try {
      const body = {
        name: `${s.name} (copy)`,
        price_cents: s.price_cents,
        billing_cycle: s.billing_cycle,
        status: "active",
        category: s.category,
        split_with: s.split_with ?? 1,
      };
      await apiFetch("/subscriptions", { method: "POST", body: JSON.stringify(body) });
      await fetchSubs();
      toast(`"${s.name}" duplicated!`, "success");
    } catch (err: any) {
      toast(err?.message ?? "Duplicate failed", "error");
    }
  }

  // ── Export subscriptions as CSV
  function exportCSV() {
    const headers = ["Name", "Price", "Billing Cycle", "Status", "Category", "Next Billing Date", "Split With"];
    const rows = subs.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      (s.price_cents / 100).toFixed(2),
      s.billing_cycle,
      s.status,
      s.category,
      s.next_billing_date ? s.next_billing_date.split("T")[0] : "",
      String(s.split_with ?? 1),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subsaver-subscriptions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Subscriptions exported as CSV!", "success");
  }

  const hasActiveFilters = searchQuery || filterStatus !== "all" || filterCategory !== "all" || sortBy !== "date";

  function clearFilters() {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterCategory("all");
    setSortBy("date");
  }

  // ── Analytics computations
  const currency = (dashSettings.currency ?? "USD") as Currency;
  const {
    totalMonthly, totalActive, totalYearly, avgPerSub,
    upcomingRenewals, widgets: analyticsWidgets,
    totalSavings, cancelledCount, mostExpensive, nextRenewalDays,
  } = useMemo(() => {
    const activeSubs = subs.filter((s) => s.status === "active");
    const sumMonthly = activeSubs.reduce((acc, s) => acc + monthlyShareCents(s), 0);
    const avgPerSubscription = activeSubs.length > 0 ? sumMonthly / activeSubs.length : 0;
    const upcoming = activeSubs
      .filter((s) => s.next_billing_date)
      .map((s) => ({ ...s, daysUntil: calculateDaysUntilRenewal(s.next_billing_date) }))
      .filter((s) => s.daysUntil !== null && s.daysUntil >= 0 && s.daysUntil <= 30)
      .sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));

    const w: Record<string, boolean> = {};
    dashSettings.widgets.forEach((widget) => { w[widget.id] = widget.enabled; });

    const savings = savedToDateCents;
    const cancelled = subs.filter(s => s.status === "cancelled").length;
    const sorted = [...activeSubs].sort((a, b) => b.price_cents - a.price_cents);
    const topSub = sorted[0];
    const nextDays = upcoming[0]?.daysUntil ?? null;

    return {
      totalMonthly: formatMoney(sumMonthly, currency, fxRates),
      totalYearly:  formatMoney(sumMonthly * 12, currency, fxRates),
      totalActive:  activeSubs.length,
      avgPerSub:    formatMoney(avgPerSubscription, currency, fxRates),
      upcomingRenewals: upcoming,
      widgets: w,
      totalSavings:    formatMoney(savings, currency, fxRates),
      cancelledCount:  String(cancelled),
      mostExpensive:   topSub ? `${topSub.name.length > 10 ? topSub.name.slice(0,9)+"…" : topSub.name}` : "N/A",
      nextRenewalDays: nextDays !== null ? `${nextDays}d` : "N/A",
    };
  }, [subs, dashSettings, fxRates, currency, savedToDateCents]);

  const layoutCompact = dashSettings.density === "compact" || dashSettings.layout === "compact";

  const statsCardValues: Record<string, string> = {
    monthly_spend:     totalMonthly,
    active_count:      String(totalActive),
    yearly_projection: totalYearly,
    avg_per_sub:       avgPerSub,
    total_savings:     totalSavings,
    cancelled_count:   cancelledCount,
    most_expensive:    mostExpensive,
    next_renewal_days: nextRenewalDays,
  };
  const statsCards = (dashSettings.statsCards ?? ["monthly_spend","active_count","yearly_projection","avg_per_sub"])
    .slice(0, 4)
    .map(id => ({ id: id as any, value: statsCardValues[id] ?? "—" }));

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen text-white pb-20 relative overflow-hidden" style={{ background: "#080B14" }}>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onAddSubscription={() => {
            // Scroll to add subscription panel
            document.getElementById("add-new-form")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}

      {/* Aurora Background */}
      <div className="aurora-container">
        <div className="aurora-blob animate-aurora-1" style={{ width: "700px", height: "700px", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", top: "-5%", right: "-5%" }} />
        <div className="aurora-blob animate-aurora-2" style={{ width: "600px", height: "600px", background: "radial-gradient(circle, rgba(217,70,239,0.09) 0%, transparent 70%)", bottom: "-5%", left: "-5%" }} />
        <div className="aurora-blob animate-aurora-3" style={{ width: "400px", height: "400px", background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)", top: "40%", left: "40%" }} />
      </div>

      {/* ── HEADER ── */}
      <header className="glass-header sticky top-0 z-20">
        {/* Main header row */}
        <div className="mx-auto max-w-[1440px]" style={{ padding: "0 clamp(1.25rem, 3vw, 3rem)" }}>
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo + greeting */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-md opacity-40" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
                  <img src="/logo.svg" alt="SubSaver" className="w-7 h-7 rounded-lg" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight leading-none" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                  Sub<span className="gradient-text">Saver</span>
                </h1>
                {user && (
                  <p className="text-xs text-white/45 mt-0.5 leading-none">
                    Hey, <span className="text-white/70 font-semibold">{displayName(user)}</span> 👋
                  </p>
                )}
              </div>
            </div>



            {/* Right: Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              {/* Verification badge */}
              {user && (
                <div className="mr-2">
                  {user.is_verified ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
                      <BadgeCheck size={13} />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowVerificationModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
                    >
                      <GraduationCap size={13} />
                      <span>Verify Student</span>
                    </button>
                  )}
                </div>
              )}

              {/* Nav links */}
              <Link
                className="px-3 py-2 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/[0.06] font-medium transition-all"
                href="/"
              >Home</Link>
              <Link
                className="px-3 py-2 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/[0.06] font-medium transition-all"
                href="/settings"
              >Settings</Link>

              {/* Divider */}
              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Logout */}
              <button
                onClick={logout}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/55 hover:text-red-400 hover:bg-red-500/[0.08] font-medium transition-all"
              >
                <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Logout</span>
              </button>

              {/* User avatar */}
              {user && (
                <div
                  className="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #D946EF)', boxShadow: '0 0 0 2px rgba(124,58,237,0.3)' }}
                  title={user.email}
                >
                  {(user.email?.[0] ?? 'U').toUpperCase()}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
              style={{ background: mobileMenuOpen ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-white/[0.06] px-6 py-4 flex flex-col gap-1"
            style={{ background: 'rgba(8,11,20,0.97)', backdropFilter: 'blur(24px)' }}
          >
            {/* User info row */}
            {user && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED, #D946EF)' }}>
                  {(user.email?.[0] ?? 'U').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{displayName(user)}</p>
                  <p className="text-[11px] text-white/40">{user.email}</p>
                </div>
                {user.is_verified && (
                  <div className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <BadgeCheck size={11} /> Verified
                  </div>
                )}
              </div>
            )}
            {user && !user.is_verified && (
              <button
                onClick={() => { setShowVerificationModal(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-violet-300 rounded-xl transition-all hover:bg-violet-500/10"
              >
                <GraduationCap size={16} /> Verify Student Email
              </button>
            )}
            <Link className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white font-medium rounded-xl hover:bg-white/[0.05] transition-all" href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white font-medium rounded-xl hover:bg-white/[0.05] transition-all" href="/settings" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
            <div className="h-px bg-white/[0.06] my-1" />
            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 font-medium rounded-xl hover:bg-red-500/[0.08] transition-all text-left">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <div
        className="relative z-10"
        style={{ padding: "1.75rem clamp(1rem, 1.5vw, 1.5rem)", display: "flex", flexDirection: "column", gap: "2rem" }}
      >

        {/* Quick Actions */}
        <div className="dashboard-quick-actions flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowServicePicker(true)}
            className="liquid-btn flex items-center justify-center gap-2.5 px-8 py-[14px]"
          >
            <Plus className="w-[18px] h-[18px] shrink-0" />
            <span className="font-bold text-[15px] leading-none">Add Subscription</span>
          </button>
          <Link href="/customize" className="liquid-btn-ghost flex items-center justify-center gap-2.5 px-7 py-[14px]">
            <Layout className="w-[18px] h-[18px] shrink-0 text-fuchsia-400" />
            <span className="font-semibold text-[15px] leading-none">Customize</span>
          </Link>
          {subs.length > 0 && (
            <button
              onClick={exportCSV}
              className="liquid-btn-ghost flex items-center justify-center gap-2.5 px-7 py-[14px]"
              title="Export subscriptions as CSV"
            >
              <Download className="w-[18px] h-[18px] shrink-0 text-emerald-400" />
              <span className="font-semibold text-[15px] leading-none">Export CSV</span>
            </button>
          )}
        </div>

        {/* Subtle divider between actions and content */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "-0.5rem 0" }} />
        {/* Demo account notice */}
        {user?.is_demo && (
          <div
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl"
            style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.25)" }}
          >
            <p className="text-sm text-cyan-200">
              You&apos;re using a temporary demo account with sample data. It will be deleted within 24 hours.
            </p>
          </div>
        )}
        {/* Verify Student prompt */}
        {user && !user.is_verified && (
          <button
            onClick={() => setShowVerificationModal(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-left transition-all hover:scale-[1.005]"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(217,70,239,0.08))", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <GraduationCap className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-300">Verify your student email</p>
              <p className="text-xs text-white/35 mt-0.5">Confirm a .edu address to mark your account as a student account</p>
            </div>
            <span className="text-xs font-bold text-violet-400 px-3 py-1.5 rounded-lg shrink-0" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>Verify →</span>
          </button>
        )}

        {/* Dashboard Content */}
        {!loading && subs.length === 0 ? (
          <DashboardEmptyState onAddSampleData={addSampleData} onAddSubscription={() => setShowServicePicker(true)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Stats Grid */}
            {!loading && isWidgetEnabled("stats") && (
              <StatsGrid
                cards={statsCards}
                totalMonthly={totalMonthly}
                totalActive={totalActive}
                totalYearly={totalYearly}
                avgPerSub={avgPerSub}
              />
            )}

            {/* Advanced Analytics */}
            {subs.length > 0 && (analyticsWidgets.spending_trends || analyticsWidgets.category_breakdown || analyticsWidgets.savings_card || analyticsWidgets.insights || analyticsWidgets.renewals || analyticsWidgets.billing_calendar) && (
              <AdvancedAnalytics
                upcomingRenewals={upcomingRenewals}
                widgets={analyticsWidgets}
                allSubscriptions={subs}
                widgetOrder={dashSettings.widgets.map(w => w.id as any)}
                widgetSizes={dashSettings.widgetSizes ?? {}}
                currency={currency}
                fxRates={fxRates}
                trendsDataProp={analyticsData}
                insightsProp={insightsData}
                disabledWidgets={dashSettings.widgets
                  .filter(w => !w.enabled && ["spending_trends","savings_card","category_breakdown","insights","renewals","billing_calendar"].includes(w.id))
                  .map(w => ({ id: w.id as any, label: w.label, color: w.color }))}
              />
            )}

            {/* Main Content Grid */}
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

              {/* Subscription List */}
              {isWidgetEnabled("subscriptions") && (
                <section className="rounded-2xl overflow-hidden min-h-[400px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Section Header */}
                  <div className="relative p-6 pb-5 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(217,70,239,0.12) 50%, rgba(79,70,229,0.08) 100%)", borderBottom: "1px solid rgba(124,58,237,0.2)" }}>
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)" }} />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(217,70,239,0.25))", border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 0 16px rgba(124,58,237,0.25)" }}>
                        <CreditCard className="w-[18px] h-[18px] text-violet-300" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>Your Subscriptions</h2>
                          <p className="text-xs text-white/40">
                            {hasActiveFilters
                              ? `Showing ${filteredSubs.length} of ${subs.length}`
                              : `${subs.length} total · ${totalActive} active`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                          <span className="text-xs text-white/40 font-medium">
                            {filteredSubs.length} of {subs.length} shown
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Search & Filter Bar ── */}
                  <div style={{ padding: "16px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      {/* Search */}
                      <div style={{ position: "relative", flex: 1 }}>
                        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "rgba(255,255,255,0.3)" }} />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search subscriptions…"
                          style={{
                            width: "100%", padding: "9px 36px", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                            color: "white", fontSize: 13, outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center" }}>
                            <XIcon style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                      </div>

                      {/* Filter toggle */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                          borderRadius: 10, border: `1px solid ${hasActiveFilters ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                          background: hasActiveFilters ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                          color: hasActiveFilters ? "#A78BFA" : "rgba(255,255,255,0.5)",
                          fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                        }}
                      >
                        <SlidersHorizontal style={{ width: 14, height: 14 }} />
                        Filters
                        {hasActiveFilters && <span style={{ background: "#7C3AED", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>!</span>}
                      </button>

                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingBottom: 14 }}>
                        {/* Status */}
                        <div style={{ flex: "1 1 140px", minWidth: 120 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Status</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {(["all", "active", "cancelled"] as const).map((s) => (
                              <button key={s} onClick={() => setFilterStatus(s)} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: `1px solid ${filterStatus === s ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`, background: filterStatus === s ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.02)", color: filterStatus === s ? "#A78BFA" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s" }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Category */}
                        <div style={{ flex: "1 1 140px", minWidth: 120 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Category</div>
                          <select
                            aria-label="Filter by category"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="liquid-select"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "#0F1220", color: "rgba(255,255,255,0.7)", fontSize: 12, outline: "none" }}
                          >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                          </select>
                        </div>

                        {/* Sort */}
                        <div style={{ flex: "1 1 140px", minWidth: 120 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Sort by</div>
                          <select
                            aria-label="Sort by"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="liquid-select"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "#0F1220", color: "rgba(255,255,255,0.7)", fontSize: 12, outline: "none" }}
                          >
                            <option value="date">Recently Added</option>
                            <option value="name">Name A–Z</option>
                            <option value="price_asc">Price ↑</option>
                            <option value="price_desc">Price ↓</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cards */}
                  <div style={{ padding: "1.5rem" }}>
                    {loading ? (
                      /* Skeleton — mimics the 3-col card grid layout */
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            {/* Icon + name row */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                              <div className="flex-1">
                                <div className="h-4 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.06)", width: "60%" }} />
                                <div className="h-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", width: "40%" }} />
                              </div>
                            </div>
                            {/* Price + progress row */}
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="h-7 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", width: "70%" }} />
                              <div className="flex flex-col gap-2 justify-center">
                                <div className="h-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
                                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                              </div>
                            </div>
                            {/* Action bar */}
                            <div className="h-8 rounded-lg mt-3" style={{ background: "rgba(255,255,255,0.04)" }} />
                          </div>
                        ))}
                      </div>
                    ) : filteredSubs.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center text-gray-400">
                        <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                          {hasActiveFilters ? <SlidersHorizontal className="w-6 h-6 text-gray-400" /> : <Plus className="w-6 h-6 text-gray-400" />}
                        </div>
                        <p className="font-medium">
                          {hasActiveFilters ? "No subscriptions match your filters" : "No subscriptions yet"}
                        </p>
                        <p className="text-sm mt-1">
                          {hasActiveFilters ? <button onClick={clearFilters} className="text-violet-400 hover:underline">Clear filters</button> : "Add your first one to see analytics"}
                        </p>
                      </div>
                    ) : (
                      <div className={layoutCompact ? "flex flex-col gap-2" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"}>
                        {(showAllSubs ? filteredSubs : filteredSubs.slice(0, CARDS_PER_PAGE)).map((s) => (
                          <SubscriptionCard
                            key={s.id}
                            sub={s}
                            isVerified={user?.is_verified ?? false}
                            discount={studentDiscounts.get(s.id)}
                            isDeleting={deletingId === s.id}
                            layoutCompact={layoutCompact}
                            currency={currency}
                            fxRates={fxRates}
                            onStartEdit={startEdit}
                            onToggleStatus={toggleStatus}
                            onConfirmDelete={confirmDelete}
                            onCancelDelete={cancelDelete}
                            onRemoveDiscount={handleRemoveDiscount}
                            onExecuteDelete={executeDelete}
                            onDuplicate={duplicateSub}
                            onDiscountClick={(d) => { setSelectedDiscount(d); setShowDiscountModal(true); }}
                          />
                        ))}
                      </div>
                    )}
                    {/* Show more / less toggle */}
                    {!layoutCompact && filteredSubs.length > CARDS_PER_PAGE && (
                      <button
                        onClick={() => setShowAllSubs(v => !v)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white transition-all"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {showAllSubs
                          ? <><XIcon className="w-4 h-4" /> Show less</>  
                          : <><Plus className="w-4 h-4" /> Show {filteredSubs.length - CARDS_PER_PAGE} more</> 
                        }
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Add Subscription Panel */}
              <div id="add-subscription-panel">
                <AddSubscriptionPanel
                  msg=""
                  onSubmit={createSub}
                  onOpenPicker={() => setShowServicePicker(true)}
                  suggestions={suggestions}
                  showSuggestions={showSuggestions}
                  onNameChange={handleNameChange}
                  onSuggestionSelect={handleServiceSelect}
                  formState={formState}
                  isSubmitting={addingSubscription}
                  autocompleteContainerRef={autocompleteRef}
                  onFormChange={(patch) => setFormState((prev) => ({ ...prev, ...patch }))}
                />

              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showDiscountModal && selectedDiscount && (
          <StudentDiscountModal
            discount={selectedDiscount}
            onApply={handleApplyDiscount}
            onClose={() => { setShowDiscountModal(false); setSelectedDiscount(null); }}
          />
        )}
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => fetchDashboard()}
        />
        {showServicePicker && (
          <ServicePickerModal
            isVerified={user?.is_verified ?? false}
            onSelect={handleServiceSelect}
            onClose={() => setShowServicePicker(false)}
          />
        )}
        {/* Edit Modal */}
        {editingSub && (
          <EditSubscriptionModal
            sub={editingSub}
            editState={editState}
            saving={savingEdit}
            onEditChange={(patch) => setEditState((prev) => ({ ...prev, ...patch }))}
            onSave={saveEdit}
            onClose={cancelEdit}
          />
        )}
      </div>
    </main>
  );
}
