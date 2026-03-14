"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
  LogOut,
  Plus,
  BadgeCheck,
  GraduationCap,
  Layout,
  CreditCard,
} from "lucide-react";
import VerificationModal from "../components/VerificationModal";
// StudentDiscountBanner removed — incompatible API (expects discount object, not isVerified flag)
import StudentDiscountModal from "../components/StudentDiscountModal";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import ServicePickerModal from "../components/ServicePickerModal";
import DashboardEmptyState from "../components/DashboardEmptyState";
import StatsGrid from "../components/dashboard/StatsGrid";
import SubscriptionCard from "../components/dashboard/SubscriptionCard";
import AddSubscriptionPanel from "../components/dashboard/AddSubscriptionPanel";
import { loadDashboardSettings, type DashboardSettings } from "../customize/page";

// ─── Types ───────────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";

type Sub = {
  id: number;
  name: string;
  price_cents: number;
  billing_cycle: BillingCycle;
  status: Status;
  category: string;
  created_at: string;
  next_billing_date?: string;
  student_discount_applied?: boolean;
  split_with?: number;
};

type StudentDiscount = {
  id: number;
  service_name: string;
  category: string;
  regular_price_cents: number;
  student_price_cents: number;
  discount_percentage: number;
  monthly_savings_cents: number;
  annual_savings_cents: number;
  requirements: string;
  verification_method: string;
  direct_link: string;
  availability: string;
  notes: string | null;
  subscription_id?: number;
  already_applied?: boolean;
};

type User = {
  id: number;
  email: string;
  is_verified: boolean;
  edu_email?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "Entertainment", icon: "🎬", color: "#7C3AED" },
  { value: "Productivity", icon: "💼", color: "#F59E0B" },
  { value: "Gaming", icon: "🎮", color: "#8B5CF6" },
  { value: "Utilities", icon: "🔧", color: "#3B82F6" },
  { value: "Communication", icon: "📱", color: "#10B981" },
  { value: "Health & Fitness", icon: "🏋️", color: "#db2777" },
  { value: "Education", icon: "📚", color: "#6366F1" },
  { value: "Food & Delivery", icon: "🍔", color: "#F97316" },
  { value: "Other", icon: "🎨", color: "#6B7280" },
];

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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

  // ── Core state
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // ── Student discounts
  const [studentDiscounts, setStudentDiscounts] = useState<Map<number, StudentDiscount>>(new Map());
  const [selectedDiscount, setSelectedDiscount] = useState<StudentDiscount | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // ── Dashboard settings (from /customize)
  const [dashSettings, setDashSettings] = useState<DashboardSettings>({ widgets: [], layout: "grid" });

  useEffect(() => {
    setDashSettings(loadDashboardSettings());
    // Re-read settings whenever window gains focus (user may have changed them)
    const onFocus = () => setDashSettings(loadDashboardSettings());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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

  // ── Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState({
    name: "",
    price: "0",
    cycle: "monthly" as BillingCycle,
    status: "active" as Status,
    category: "Other",
    billingDate: "",
    isSplit: false,
    splitWith: 1,
  });

  // ── Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Fetch on mount
  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) router.push("/login");
    fetchSubs();
    fetchUser();
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
    setMsg("");
    setLoading(true);
    try {
      const data = await apiFetch("/subscriptions", { method: "GET" });
      setSubs(data);
      await loadStudentDiscounts(data);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentDiscounts(subscriptions: Sub[]) {
    try {
      const discountMap = new Map<number, StudentDiscount>();
      for (const sub of subscriptions) {
        if (sub.status === "active") {
          try {
            const discount = await apiFetch(`/api/student-discounts/check/${sub.id}`, { method: "GET" });
            if (discount) discountMap.set(sub.id, discount);
          } catch {
            // no discount for this sub
          }
        }
      }
      setStudentDiscounts(discountMap);
    } catch (err) {
      console.error("Failed to load student discounts:", err);
    }
  }

  async function addSampleData() {
    const sampleSubs = [
      { name: "Spotify", price_cents: 999, billing_cycle: "monthly", category: "Entertainment", split_with: 2 },
      { name: "Netflix", price_cents: 1599, billing_cycle: "monthly", category: "Entertainment", split_with: 4 },
      { name: "Adobe Creative Cloud", price_cents: 5499, billing_cycle: "monthly", category: "Productivity", split_with: 1 },
      { name: "Xbox Game Pass", price_cents: 999, billing_cycle: "monthly", category: "Gaming", split_with: 1 },
    ];
    try {
      for (const sub of sampleSubs) {
        await apiFetch("/subscriptions", { method: "POST", body: JSON.stringify(sub) });
      }
      await fetchSubs();
    } catch (err) {
      console.error("Failed to add sample data", err);
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
      setMsg("✅ Student discount marked as applied!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to apply discount");
    }
  }

  function logout() {
    localStorage.removeItem("subsaver_token");
    router.push("/login");
  }

  // ── Add subscription
  async function createSub(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
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
      setMsg("✅ Subscription created!");
      fetchSubs();
    } catch (err: any) {
      setMsg(err?.message ?? "Create failed");
    }
  }

  function handleServiceSelect(service: StudentDiscount) {
    setShowServicePicker(false);
    const priceToSet = user?.is_verified ? service.student_price_cents : service.regular_price_cents;
    // Pre-fill the form so user can review before confirming
    setFormState((prev) => ({
      ...prev,
      name: service.service_name,
      price: (priceToSet / 100).toFixed(2),
      category: service.category || "Other",
      cycle: "monthly",
    }));
    setMsg(`✏️ Review ${service.service_name} details below, then click "Add Subscription" to confirm.`);
    setTimeout(() => setMsg(""), 4000);
    setTimeout(() => {
      document.getElementById("add-subscription-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

  // ── Edit handlers
  function startEdit(s: Sub) {
    setEditingId(s.id);
    setEditState({
      name: s.name,
      price: (s.price_cents / 100).toFixed(2),
      cycle: s.billing_cycle,
      status: s.status,
      category: s.category || "Other",
      billingDate: s.next_billing_date ? s.next_billing_date.split("T")[0] : "",
      splitWith: s.split_with || 1,
      isSplit: (s.split_with || 1) > 1,
    });
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setMsg("");
  }

  async function saveEdit(subId: number) {
    setMsg("");
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
      setEditingId(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Update failed");
    }
  }

  async function toggleStatus(s: Sub) {
    setMsg("");
    const next: Status = s.status === "active" ? "cancelled" : "active";
    setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    try {
      const updated = await apiFetch(`/subscriptions/${s.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setSubs((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch (err: any) {
      setSubs((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      setMsg(err?.message ?? "Toggle failed");
    }
  }

  function confirmDelete(subId: number) {
    if (editingId === subId) setEditingId(null);
    setDeletingId(subId);
    setMsg("");
  }

  function cancelDelete() {
    setDeletingId(null);
    setMsg("");
  }

  async function executeDelete(subId: number) {
    setMsg("");
    try {
      await apiFetch(`/subscriptions/${subId}`, { method: "DELETE" });
      setSubs((prev) => prev.filter((s) => s.id !== subId));
      if (deletingId === subId) setDeletingId(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Delete failed");
    }
  }

  // ── Analytics computations
  const {
    totalMonthly, totalActive, totalYearly, avgPerSub,
    upcomingRenewals, widgets: analyticsWidgets,
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

    // Build legacy widgets object for AdvancedAnalytics
    const w: Record<string, boolean> = {};
    dashSettings.widgets.forEach((widget) => { w[widget.id] = widget.enabled; });

    return {
      totalMonthly: formatMoney(sumMonthly),
      totalYearly: formatMoney(sumMonthly * 12),
      totalActive: activeSubs.length,
      avgPerSub: formatMoney(avgPerSubscription),
      upcomingRenewals: upcoming,
      widgets: w,
    };
  }, [subs, dashSettings.widgets]);

  const layoutCompact = dashSettings.layout === "compact";

  return (
    <main className="min-h-screen text-white pb-20 relative overflow-hidden" style={{ background: "#080B14" }}>
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
            <Link className="text-sm text-white/40 hover:text-white font-medium transition-colors" href="/">Home</Link>
            <Link className="text-sm text-white/40 hover:text-white font-medium transition-colors" href="/settings">Settings</Link>
            <button onClick={logout} className="group flex items-center gap-2 text-sm text-white/40 hover:text-white font-medium transition-colors">
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-10 py-8 space-y-6">

        {/* Quick Actions */}
        <div className="flex gap-3 mb-2 overflow-x-auto pb-2">
          <button
            onClick={() => setShowServicePicker(true)}
            className="liquid-btn flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">Add Subscription</span>
          </button>
          <Link
            href="/customize"
            className="liquid-btn-ghost flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0"
          >
            <Layout className="w-5 h-5 text-fuchsia-400" />
            <span className="font-medium">Customize</span>
          </Link>
        </div>

        {/* Verify Student prompt for unverified users */}
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
          <>
            {/* Stats Grid */}
            {!loading && isWidgetEnabled("stats") && (
              <StatsGrid
                totalMonthly={totalMonthly}
                totalActive={totalActive}
                totalYearly={totalYearly}
                avgPerSub={avgPerSub}
              />
            )}

            {/* Advanced Analytics */}
            {subs.length > 0 && <AdvancedAnalytics upcomingRenewals={upcomingRenewals} widgets={analyticsWidgets} />}

            {/* Main Content Grid */}
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

              {/* Subscription List */}
              {isWidgetEnabled("subscriptions") && (
                <section className="liquid-panel rounded-2xl p-6 min-h-[400px]">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                          <CreditCard className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>Your Subscriptions</h2>
                          <p className="text-xs text-white/35">Manage and track your services</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xl font-black text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>{subs.length}</div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider">Total</div>
                        </div>
                        <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="text-center">
                          <div className="text-xl font-black text-green-400" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>{totalActive}</div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider">Active</div>
                        </div>
                      </div>
                    </div>
                    <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl border border-white/5" />)}
                    </div>
                  ) : subs.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center text-gray-400">
                      <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium">No subscriptions yet</p>
                      <p className="text-sm mt-1">Add your first one to see analytics</p>
                    </div>
                  ) : (
                    <div className={layoutCompact ? "flex flex-col gap-2" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"}>
                      {subs.map((s) => (
                        <SubscriptionCard
                          key={s.id}
                          sub={s}
                          isVerified={user?.is_verified ?? false}
                          discount={studentDiscounts.get(s.id)}
                          isEditing={editingId === s.id}
                          isDeleting={deletingId === s.id}
                          editState={editState}
                          layoutCompact={layoutCompact}
                          onStartEdit={startEdit}
                          onCancelEdit={cancelEdit}
                          onSaveEdit={saveEdit}
                          onToggleStatus={toggleStatus}
                          onConfirmDelete={confirmDelete}
                          onCancelDelete={cancelDelete}
                          onExecuteDelete={executeDelete}
                          onDiscountClick={(d) => { setSelectedDiscount(d); setShowDiscountModal(true); }}
                          onEditChange={(patch) => setEditState((prev) => ({ ...prev, ...patch }))}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Add Subscription Panel */}
              <AddSubscriptionPanel
                msg={msg}
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
          </>
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
      </div>
    </main>
  );
}
