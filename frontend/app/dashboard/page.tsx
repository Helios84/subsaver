"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
  LogOut, Plus, BadgeCheck, GraduationCap, Layout, CreditCard,
  Search, SlidersHorizontal, X as XIcon,
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
import { loadDashboardSettings, type DashboardSettings, CURRENCY_SYMBOLS } from "../customize/page";
import { useToast } from "../components/ToastProvider";
import OnboardingModal, { shouldShowOnboarding } from "../components/OnboardingModal";
import { getExchangeRates, formatMoney as fxFormat, type Currency } from "../lib/currency";
import type { Sub, StudentDiscount, UserOut as User } from "../types/index";

// ─── Local aliases ────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "Entertainment",   icon: "🎬", color: "#7C3AED" },
  { value: "Productivity",    icon: "💼", color: "#F59E0B" },
  { value: "Gaming",          icon: "🎮", color: "#8B5CF6" },
  { value: "Utilities",       icon: "🔧", color: "#3B82F6" },
  { value: "Communication",   icon: "📱", color: "#10B981" },
  { value: "Health & Fitness",icon: "🏋️", color: "#db2777" },
  { value: "Education",       icon: "📚", color: "#6366F1" },
  { value: "Food & Delivery", icon: "🍔", color: "#F97316" },
  { value: "News & Media",    icon: "📰", color: "#EAB308" },
  { value: "Finance",         icon: "💳", color: "#10B981" },
  { value: "Other",           icon: "📦", color: "#6B7280" },
];

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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // ── Dashboard settings (from /customize)
  const [dashSettings, setDashSettings] = useState<DashboardSettings>(loadDashboardSettings);

  // ── Real FX rates for currency conversion
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, GBP: 0.79 });

  // ── Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setDashSettings(loadDashboardSettings());
    const onFocus = () => setDashSettings(loadDashboardSettings());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dashboard_settings_v4") setDashSettings(loadDashboardSettings());
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
  const [allServices, setAllServices] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    apiFetch("/api/student-discounts")
      .then((data) => { if (Array.isArray(data)) setAllServices(data); })
      .catch((err) => console.error("Failed to fetch autocomplete services", err));
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
    fetchSubs();
    fetchUser();
    // Load real FX rates
    getExchangeRates().then(setFxRates).catch(console.warn);
    // Show onboarding for first-time visitors
    if (shouldShowOnboarding()) setShowOnboarding(true);
  }, [router]);

  async function fetchUser() {
    try {
      const data = await apiFetch("/users/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  }

  async function fetchSubs() {
    setLoading(true);
    try {
      const data = await apiFetch("/subscriptions", { method: "GET" });
      setSubs(data);
      await loadStudentDiscounts(data);
    } catch (err: any) {
      toast(err?.message ?? "Failed to load subscriptions", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentDiscounts(subscriptions: Sub[]) {
    try {
      const ids = subscriptions.filter((s) => s.status === "active").map((s) => s.id);
      if (ids.length === 0) { setStudentDiscounts(new Map()); return; }
      const result = await apiFetch("/api/student-discounts/batch-check", {
        method: "POST",
        body: JSON.stringify({ subscription_ids: ids }),
      });
      const discountMap = new Map<number, StudentDiscount>();
      for (const [idStr, discount] of Object.entries(result)) {
        if (discount) discountMap.set(Number(idStr), discount as StudentDiscount);
      }
      setStudentDiscounts(discountMap);
    } catch (err) {
      console.error("Failed to load student discounts:", err);
    }
  }

  async function addSampleData() {
    toast("Adding demo subscriptions…", "info");
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
      toast("Demo data added! Explore your dashboard.", "success");
    } catch (err) {
      toast("Failed to add demo data. Please try again.", "error");
    }
  }

  async function handleApplyDiscount(subscriptionId: number) {
    try {
      await apiFetch(`/api/student-discounts/apply/${subscriptionId}`, { method: "POST" });
      setSubs((prev) => prev.map((s) => s.id === subscriptionId ? { ...s, student_discount_applied: true } : s));
      setStudentDiscounts((prev) => {
        const newMap = new Map(prev);
        const d = newMap.get(subscriptionId);
        if (d) newMap.set(subscriptionId, { ...d, already_applied: true });
        return newMap;
      });
      toast("Student discount marked as applied!", "success");
    } catch (err: any) {
      toast(err?.message ?? "Failed to apply discount", "error");
    }
  }

  function logout() {
    localStorage.removeItem("subsaver_token");
    router.push("/login");
  }

  // ── Add subscription
  async function createSub(e: React.FormEvent) {
    e.preventDefault();
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
    }
  }

  async function handleServiceSelect(service: StudentDiscount) {
    setShowServicePicker(false);
    const priceToSet = user?.is_verified ? service.student_price_cents : service.regular_price_cents;
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
    const sumMonthly = activeSubs.reduce((acc, s) => {
      return acc + (s.billing_cycle === "monthly" ? s.price_cents : Math.round(s.price_cents / 12));
    }, 0);
    const avgPerSubscription = activeSubs.length > 0 ? sumMonthly / activeSubs.length : 0;
    const today = new Date();
    const upcoming = activeSubs
      .filter((s) => s.next_billing_date)
      .map((s) => ({ ...s, daysUntil: calculateDaysUntilRenewal(s.next_billing_date) }))
      .filter((s) => s.daysUntil !== null && s.daysUntil >= 0 && s.daysUntil <= 30)
      .sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));

    const w: Record<string, boolean> = {};
    dashSettings.widgets.forEach((widget) => { w[widget.id] = widget.enabled; });

    // totalSavings shown via StudentSavingsCard API — use 0 as placeholder in stat cards
    const savings = 0; // StudentSavingsCard fetches real data from /api/student-discounts/savings
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
  }, [subs, dashSettings, fxRates, currency]);

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

      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-md opacity-40" />
              <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
                <img src="/logo.png" alt="SubSaver" className="w-7 h-7 rounded-lg" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Sub<span className="gradient-text">Saver</span>
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {user && (
              <div className="hidden md:flex items-center">
                {user.is_verified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34D399" }}>
                    <BadgeCheck size={14} />
                    <span>Student Verified</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA" }}
                  >
                    <GraduationCap size={14} />
                    <span>Verify Student</span>
                  </button>
                )}
              </div>
            )}
            <Link className="text-sm text-white/65 hover:text-white font-medium transition-colors" href="/">Home</Link>
            <Link className="text-sm text-white/65 hover:text-white font-medium transition-colors" href="/settings">Settings</Link>
            <button onClick={logout} className="group flex items-center gap-2 text-sm text-white/65 hover:text-white font-medium transition-colors">
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-12 xl:px-16 py-10 space-y-16">

        {/* Quick Actions */}
        <div className="flex gap-3 mb-2 overflow-x-auto pb-2">
          <button
            onClick={() => setShowServicePicker(true)}
            className="liquid-btn flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">Add Subscription</span>
          </button>
          <Link href="/customize" className="liquid-btn-ghost flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0">
            <Layout className="w-5 h-5 text-fuchsia-400" />
            <span className="font-medium">Customize</span>
          </Link>
        </div>

        {/* Verify Student prompt */}
        {user && !user.is_verified && (
          <button
            onClick={() => setShowVerificationModal(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-left transition-all hover:scale-[1.005]"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(217,70,239,0.08))", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <GraduationCap className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-300">Verify your student email to unlock exclusive discounts</p>
              <p className="text-xs text-white/35 mt-0.5">Get up to 50% off popular subscriptions with a .edu email</p>
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
                        <div className="flex flex-col items-center px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <div className="text-xl font-black text-white font-mono tabular-nums leading-none">{subs.length}</div>
                          <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Total</div>
                        </div>
                        <div className="flex flex-col items-center px-3 py-1.5 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                          <div className="text-xl font-black text-emerald-400 font-mono tabular-nums leading-none">{totalActive}</div>
                          <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider mt-0.5">Active</div>
                        </div>
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
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, paddingBottom: 14 }}>
                        {/* Status */}
                        <div>
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
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Category</div>
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "#0F1220", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", outline: "none" }}
                          >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                          </select>
                        </div>

                        {/* Sort */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Sort by</div>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "#0F1220", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", outline: "none" }}
                          >
                            <option value="date">Date Added</option>
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
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl border border-white/5" />)}
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
                        {filteredSubs.map((s) => (
                          <SubscriptionCard
                            key={s.id}
                            sub={s}
                            isVerified={user?.is_verified ?? false}
                            discount={studentDiscounts.get(s.id)}
                            isDeleting={deletingId === s.id}
                            layoutCompact={layoutCompact}
                            onStartEdit={startEdit}
                            onToggleStatus={toggleStatus}
                            onConfirmDelete={confirmDelete}
                            onCancelDelete={cancelDelete}
                            onExecuteDelete={executeDelete}
                            onDiscountClick={(d) => { setSelectedDiscount(d); setShowDiscountModal(true); }}
                          />
                        ))}
                      </div>
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
          onSuccess={() => fetchUser()}
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
