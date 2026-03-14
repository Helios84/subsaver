"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  Activity,
  TrendingUp,
  PieChart,
  Zap,
  Calendar,
  GraduationCap,
  BarChart2,
  CreditCard,
  LayoutGrid,
  AlignJustify,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  RotateCcw,
  Save,
  Plus,
  BadgeCheck,
  Layout,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import StatsGrid from "../components/dashboard/StatsGrid";
import AdvancedAnalytics from "../components/AdvancedAnalytics";

// ─── Types ────────────────────────────────────────────────────────────────────
export type WidgetId =
  | "stats"
  | "spending_trends"
  | "category_breakdown"
  | "insights"
  | "renewals"
  | "savings_card"
  | "top_expenses"
  | "subscriptions";

export type WidgetConfig = {
  id: WidgetId;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  color: string;
};

export type DashboardSettings = {
  widgets: WidgetConfig[];
  layout: "grid" | "compact";
};

// ─── Default Widget Definitions ──────────────────────────────────────────────
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats",              label: "Statistics",          description: "Monthly spend, active subs, projections & averages", icon: Activity,      enabled: true, color: "#8B5CF6" },
  { id: "spending_trends",    label: "Spending Trends",     description: "Area chart of spending over the last 6 months",      icon: TrendingUp,    enabled: true, color: "#06B6D4" },
  { id: "category_breakdown", label: "Category Breakdown",  description: "Pie chart of spending by category",                  icon: PieChart,      enabled: true, color: "#D946EF" },
  { id: "insights",           label: "Insights Panel",      description: "Smart tips and alerts based on your data",           icon: Zap,           enabled: true, color: "#F59E0B" },
  { id: "renewals",           label: "Upcoming Renewals",   description: "Subscriptions renewing in the next 30 days",         icon: Calendar,      enabled: true, color: "#10B981" },
  { id: "savings_card",       label: "Student Savings",     description: "Track your student discount savings",                icon: GraduationCap, enabled: true, color: "#EC4899" },
  { id: "top_expenses",       label: "Top Expenses",        description: "Bar chart of your most expensive subscriptions",     icon: BarChart2,     enabled: true, color: "#F97316" },
  { id: "subscriptions",      label: "Subscriptions List",  description: "Your full subscription list and management section", icon: CreditCard,    enabled: true, color: "#6366F1" },
];

const STORAGE_KEY = "dashboard_settings_v2";
type SavedSettings = { widgets: { id: WidgetId; enabled: boolean }[]; layout: "grid" | "compact" };

// ─── Settings Persistence ─────────────────────────────────────────────────────
export function loadDashboardSettings(): DashboardSettings {
  if (typeof window === "undefined") return { widgets: DEFAULT_WIDGETS, layout: "grid" };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { widgets: DEFAULT_WIDGETS, layout: "grid" };
    const parsed = JSON.parse(saved) as SavedSettings;
    const enabledMap: Record<string, boolean> = {};
    const savedOrder: WidgetId[] = [];
    for (const w of parsed.widgets) { enabledMap[w.id] = w.enabled; savedOrder.push(w.id); }
    const allIds = [...savedOrder, ...DEFAULT_WIDGETS.map((w) => w.id).filter((id) => !savedOrder.includes(id))];
    const widgets = allIds.map((id) => {
      const def = DEFAULT_WIDGETS.find((w) => w.id === id);
      if (!def) return null;
      return { ...def, enabled: enabledMap[id] ?? true };
    }).filter(Boolean) as WidgetConfig[];
    return { widgets, layout: parsed.layout ?? "grid" };
  } catch { return { widgets: DEFAULT_WIDGETS, layout: "grid" }; }
}

export function saveDashboardSettings(settings: DashboardSettings) {
  const toSave: SavedSettings = {
    widgets: settings.widgets.map((w) => ({ id: w.id, enabled: w.enabled })),
    layout: settings.layout,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// ─── Data Types (mirrored from dashboard) ────────────────────────────────────
type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";
type Sub = {
  id: number; name: string; price_cents: number; billing_cycle: BillingCycle;
  status: Status; category: string; created_at: string;
  next_billing_date?: string; student_discount_applied?: boolean; split_with?: number;
};

function formatMoney(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

// ─── Real Dashboard Preview ───────────────────────────────────────────────────
// Renders actual dashboard components (StatsGrid, AdvancedAnalytics, subscription cards)
// inside a CSS-scaled container so it looks identical to the real dashboard.
function RealDashboardPreview({
  settings,
  subs,
  user,
}: {
  settings: DashboardSettings;
  subs: Sub[];
  user: { is_verified: boolean; email: string } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);

  // Dashboard inner width: assume max-w-[1600px] with px-12, so effective ~1576px
  const DASHBOARD_WIDTH = 1400;

  useEffect(() => {
    function computeScale() {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth - 32; // 16px padding each side
        setScale(Math.min(availableWidth / DASHBOARD_WIDTH, 0.9));
      }
    }
    computeScale();
    const ro = new ResizeObserver(computeScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isWidgetEnabled = (id: string) => settings.widgets.find((w) => w.id === id)?.enabled ?? true;

  // Compute stats (same logic as dashboard page)
  const activeSubs = subs.filter((s) => s.status === "active");
  const sumMonthly = activeSubs.reduce((acc, s) =>
    acc + (s.billing_cycle === "monthly" ? s.price_cents : Math.round(s.price_cents / 12)), 0);
  const avgPerSub = activeSubs.length > 0 ? sumMonthly / activeSubs.length : 0;

  const today = new Date();
  const upcomingRenewals = activeSubs
    .filter((s) => s.next_billing_date)
    .map((s) => {
      const d = new Date(s.next_billing_date!);
      const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...s, daysUntil: days };
    })
    .filter((s) => s.daysUntil >= 0 && s.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Build widget map for AdvancedAnalytics
  const widgetMap: Record<string, boolean> = {};
  settings.widgets.forEach((w) => { widgetMap[w.id] = w.enabled; });

  const analyticsVisible = widgetMap.spending_trends || widgetMap.category_breakdown || widgetMap.savings_card || widgetMap.insights || widgetMap.renewals;

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto overflow-x-hidden">
      {/* Scaled inner container */}
      <div
        style={{
          width: DASHBOARD_WIDTH,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          // Height grows naturally; outer container scrolls
          marginBottom: -DASHBOARD_WIDTH * (1 - scale), // reclaim space from scale shrinkage
        }}
      >
        {/* ── Simulated Dashboard Header ── */}
        <div
          className="flex items-center justify-between px-6 py-3.5 mb-6 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-md opacity-40" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sub<span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saver</span>
            </h1>
          </div>
          <div className="flex items-center gap-5">
            {user && !user.is_verified && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA" }}>
                <GraduationCap size={12} /> Verify Student
              </div>
            )}
            {user?.is_verified && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34D399" }}>
                <BadgeCheck size={12} /> Student Verified
              </div>
            )}
            <span className="text-sm text-white/30">Home</span>
            <span className="text-sm text-white/30">Settings</span>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl" style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}>
            <Plus className="w-5 h-5 text-white" />
            <span className="font-bold text-white text-sm">Add Subscription</span>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Layout className="w-5 h-5 text-fuchsia-400" />
            <span className="font-medium text-white/60 text-sm">Customize</span>
          </div>
        </div>

        {/* ── Verify Banner (if not verified) ── */}
        {user && !user.is_verified && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl mb-6" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(217,70,239,0.08))", border: "1px solid rgba(124,58,237,0.2)" }}>
            <GraduationCap className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-300">Verify your student email to unlock exclusive discounts</p>
              <p className="text-xs text-white/35 mt-0.5">Get up to 50% off popular subscriptions with a .edu email</p>
            </div>
            <span className="text-xs font-bold text-violet-400 px-3 py-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>Verify →</span>
          </div>
        )}

        {/* ── Stats Grid ── */}
        {isWidgetEnabled("stats") && subs.length > 0 && (
          <div className="mb-6">
            <StatsGrid
              totalMonthly={formatMoney(sumMonthly)}
              totalActive={activeSubs.length}
              totalYearly={formatMoney(sumMonthly * 12)}
              avgPerSub={formatMoney(avgPerSub)}
            />
          </div>
        )}

        {/* ── Analytics ── */}
        {subs.length > 0 && analyticsVisible && (
          <div className="mb-6">
            <AdvancedAnalytics upcomingRenewals={upcomingRenewals} widgets={widgetMap} />
          </div>
        )}

        {/* ── Subscriptions List ── */}
        {isWidgetEnabled("subscriptions") && (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="liquid-panel rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                    <CreditCard className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Your Subscriptions</h2>
                    <p className="text-xs text-white/35">Manage and track your services</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-black text-white">{subs.length}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">Total</div>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="text-center">
                    <div className="text-xl font-black text-green-400">{activeSubs.length}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">Active</div>
                  </div>
                </div>
              </div>

              {/* Subscription items */}
              {subs.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No subscriptions yet</p>
                </div>
              ) : settings.layout === "compact" ? (
                <div className="space-y-2">
                  {subs.map((s) => {
                    const catColors: Record<string, string> = { "Entertainment": "#7C3AED", "Productivity": "#F59E0B", "Gaming": "#8B5CF6", "Utilities": "#3B82F6", "Other": "#6B7280" };
                    const col = catColors[s.category] || "#6B7280";
                    const price = s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents;
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: `${col}18`, border: `1px solid ${col}30`, color: col }}>
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{s.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-400"}`}>{s.status}</span>
                            <span className="text-[10px] text-white/30 capitalize">{s.billing_cycle}</span>
                          </div>
                        </div>
                        <div className="text-emerald-400 font-bold text-base shrink-0">{formatMoney(price)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {subs.map((s) => {
                    const catColors: Record<string, string> = { "Entertainment": "#7C3AED", "Productivity": "#F59E0B", "Gaming": "#8B5CF6", "Utilities": "#3B82F6", "Other": "#6B7280" };
                    const col = catColors[s.category] || "#6B7280";
                    const price = s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents;
                    return (
                      <div key={s.id} className="rounded-xl p-5 relative overflow-hidden liquid-card">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="relative shrink-0">
                            <div className="absolute inset-0 blur-lg rounded-full" style={{ background: `${col}40` }} />
                            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl" style={{ background: `${col}18`, border: `1px solid ${col}30`, color: col }}>
                              {s.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-base truncate">{s.name}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${s.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-gray-400 border-white/10"}`}>{s.status}</span>
                              <span className="text-[11px] text-white/40 capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{s.billing_cycle}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="relative inline-block">
                            <div className="absolute inset-0 bg-green-400/30 blur-lg rounded-lg" />
                            <div className="relative text-2xl font-bold text-green-400">{formatMoney(price)}</div>
                          </div>
                          {s.split_with && s.split_with > 1 && (
                            <p className="text-xs text-gray-400 mt-0.5">Split with {s.split_with} • Total: {formatMoney(s.price_cents)}</p>
                          )}
                        </div>
                        {s.next_billing_date && (
                          <div className="flex items-center gap-2 text-xs text-white/30 border-t border-white/5 pt-3">
                            <Calendar className="w-3 h-3" />
                            {new Date(s.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        )}
                        {/* Action buttons (visual only in preview) */}
                        <div className="flex items-center gap-2 mt-4">
                          {["Edit", "Pause", "Delete"].map((a, i) => (
                            <div key={a} className="flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg text-white/20" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{a}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Add Subscription Panel (read-only in preview) */}
            <aside className="liquid-panel rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <Plus className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="font-bold text-white">Add New</h3>
              </div>
              <div className="space-y-3">
                {["Service Name", "Cost", "Billing Cycle", "Category"].map((label) => (
                  <div key={label}>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5">{label}</p>
                    <div className="h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                ))}
                <div className="mt-4 py-3 rounded-xl text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#7C3AED,#DB2777)", boxShadow: "0 4px 15px rgba(124,58,237,0.25)" }}>
                  + Add Subscription
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Empty state */}
        {subs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <CreditCard className="w-10 h-10 text-violet-400 opacity-50" />
            </div>
            <div>
              <p className="text-white/50 text-lg font-semibold">No subscriptions yet</p>
              <p className="text-white/25 text-sm mt-1">Add subscriptions to see your dashboard here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sortable Widget Row ──────────────────────────────────────────────────────
function SortableWidgetRow({ widget, onToggle, index }: {
  widget: WidgetConfig; onToggle: (id: WidgetId) => void; index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const Icon = widget.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 ${
        widget.enabled
          ? "bg-white/[0.03] border-white/8 hover:border-white/15 hover:bg-white/[0.05]"
          : "bg-black/15 border-white/[0.04] opacity-50 hover:opacity-65"
      }`}
    >
      <span className="text-[10px] font-bold text-white/15 w-4 shrink-0 text-center select-none">{index + 1}</span>
      <button {...attributes} {...listeners} className="text-white/15 hover:text-white/50 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none p-0.5">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: widget.enabled ? `${widget.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${widget.enabled ? `${widget.color}28` : "rgba(255,255,255,0.06)"}` }}>
        <Icon className="w-3 h-3" style={{ color: widget.enabled ? widget.color : "rgba(255,255,255,0.18)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight truncate ${widget.enabled ? "text-white" : "text-white/25"}`}>{widget.label}</p>
      </div>
      <button
        onClick={() => onToggle(widget.id)}
        className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
          widget.enabled
            ? "text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10"
            : "text-white/20 border border-white/6 hover:text-white/40 hover:bg-white/5"
        }`}
      >
        {widget.enabled ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
      </button>
    </div>
  );
}

// Drag overlay
function WidgetDragOverlay({ widget }: { widget: WidgetConfig | null }) {
  if (!widget) return null;
  const Icon = widget.icon;
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl border shadow-2xl shadow-black/60 cursor-grabbing backdrop-blur-2xl" style={{ width: 320, background: `linear-gradient(135deg, ${widget.color}12, rgba(0,0,0,0.8))`, borderColor: `${widget.color}40` }}>
      <GripVertical className="w-3.5 h-3.5 text-white/30 shrink-0" />
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${widget.color}20`, border: `1px solid ${widget.color}35` }}>
        <Icon className="w-3 h-3" style={{ color: widget.color }} />
      </div>
      <p className="text-xs font-semibold text-white">{widget.label}</p>
    </div>
  );
}

// ─── Layout Option ────────────────────────────────────────────────────────────
function LayoutOption({ active, onClick, icon: Icon, label, sublabel }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; sublabel: string;
}) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left flex-1 transition-all ${active ? "border-violet-500/40 bg-violet-500/10" : "border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/12"}`}>
      {active && <Check className="w-3 h-3 text-violet-400 shrink-0" />}
      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-violet-400" : "text-white/25"}`} />
      <div className="min-w-0">
        <p className={`text-xs font-bold ${active ? "text-white" : "text-white/40"}`}>{label}</p>
        <p className="text-[9px] text-white/20 leading-tight">{sublabel}</p>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomizePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<DashboardSettings>({ widgets: DEFAULT_WIDGETS, layout: "grid" });
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [user, setUser] = useState<{ is_verified: boolean; email: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) { router.push("/login"); return; }
    setSettings(loadDashboardSettings());
    // Fetch user data for realistic preview
    apiFetch("/subscriptions").then(setSubs).catch(console.error);
    apiFetch("/users/me").then(setUser).catch(console.error);
  }, [router]);

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as WidgetId); }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSettings((prev) => {
      const oi = prev.widgets.findIndex((w) => w.id === active.id);
      const ni = prev.widgets.findIndex((w) => w.id === over.id);
      return { ...prev, widgets: arrayMove(prev.widgets, oi, ni) };
    });
    setIsDirty(true);
  }
  function handleToggle(id: WidgetId) {
    setSettings((prev) => ({ ...prev, widgets: prev.widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)) }));
    setIsDirty(true);
  }
  function handleSave() {
    saveDashboardSettings(settings);
    setSaved(true); setIsDirty(false);
    setTimeout(() => setSaved(false), 2500);
  }
  function handleReset() {
    const d = { widgets: DEFAULT_WIDGETS, layout: "grid" as const };
    setSettings(d); saveDashboardSettings(d); setIsDirty(false);
  }

  const enabledCount = settings.widgets.filter((w) => w.enabled).length;
  const totalCount = settings.widgets.length;
  const activeWidget = settings.widgets.find((w) => w.id === activeId) ?? null;

  return (
    <main className="min-h-screen text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #09090f 0%, #0d0b1a 50%, #080B14 100%)" }}>
      {/* Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-[140px] opacity-12" style={{ width: 700, height: 700, background: "radial-gradient(circle, #7C3AED, transparent 70%)", top: -300, right: -200 }} />
        <div className="absolute rounded-full blur-[100px] opacity-8" style={{ width: 400, height: 400, background: "radial-gradient(circle, #D946EF, transparent 70%)", bottom: -100, left: -50 }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: "rgba(9,9,15,0.88)", backdropFilter: "blur(24px)" }}>
        <div className="px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/35 hover:text-white transition-colors text-sm group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <h1 className="text-sm font-bold text-white">Customize Dashboard</h1>
              {isDirty && <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Unsaved</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="text-xs text-white/25 hover:text-white/60 transition-colors px-2.5 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3" /><span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                saved ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : isDirty ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-fuchsia-500/25"
                : "bg-white/5 border border-white/10 text-white/30 cursor-default"
              }`}
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save</>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Split Screen ── */}
      <div className="flex" style={{ height: "calc(100vh - 56px)" }}>

        {/* LEFT: Settings sidebar */}
        <aside className="w-[320px] shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* Layout */}
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">Card Layout</p>
              <div className="flex gap-2">
                <LayoutOption active={settings.layout === "grid"} onClick={() => { setSettings((p) => ({ ...p, layout: "grid" })); setIsDirty(true); }} icon={LayoutGrid} label="Grid" sublabel="Cards in a grid" />
                <LayoutOption active={settings.layout === "compact"} onClick={() => { setSettings((p) => ({ ...p, layout: "compact" })); setIsDirty(true); }} icon={AlignJustify} label="Compact" sublabel="Dense list" />
              </div>
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* Widgets */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Widgets</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-14 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(enabledCount / totalCount) * 100}%`, background: "linear-gradient(90deg,#7C3AED,#D946EF)" }} />
                  </div>
                  <span className="text-[9px] text-white/25 font-mono">{enabledCount}/{totalCount}</span>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={settings.widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {settings.widgets.map((widget, index) => (
                      <SortableWidgetRow key={widget.id} widget={widget} onToggle={handleToggle} index={index} />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  <WidgetDragOverlay widget={activeWidget} />
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-white/[0.05] space-y-2 shrink-0">
            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                saved ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-fuchsia-500/20 hover:scale-[1.01]"
              }`}
            >
              {saved ? <><Check className="w-4 h-4" /> All saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            <Link href="/dashboard" className="block w-full py-2.5 rounded-xl text-center text-xs font-medium text-white/30 hover:text-white/60 border border-white/6 hover:bg-white/[0.03] transition-all">
              ← Back to Dashboard
            </Link>
          </div>
        </aside>

        {/* RIGHT: Live REAL preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview chrome bar */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.04] shrink-0" style={{ background: "rgba(9,9,15,0.6)", backdropFilter: "blur(12px)" }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,0.4)" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,0.4)" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,0.4)" }} />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-full text-[10px] text-white/20 border border-white/6 bg-white/[0.02]">
                subsaver.example/dashboard
              </div>
            </div>
            <div className="text-[10px] text-white/20 font-mono">{enabledCount} widgets active</div>
          </div>

          {/* Dashboard preview with real background */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ background: "#080B14" }}
          >
            {/* Aurora blobs (same as real dashboard) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute rounded-full blur-[80px] opacity-10" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(124,58,237,0.15),transparent 70%)", top: "-5%", right: "-5%" }} />
              <div className="absolute rounded-full blur-[60px] opacity-8" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(217,70,239,0.1),transparent 70%)", bottom: "-5%", left: "-5%" }} />
            </div>

            {/* Real dashboard content */}
            <div className="relative z-10 h-full p-4">
              <RealDashboardPreview settings={settings} subs={subs} user={user} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
