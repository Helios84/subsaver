"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, GripVertical, Activity, TrendingUp, PieChart, Zap,
  Calendar, GraduationCap, BarChart2, CreditCard, LayoutGrid,
  AlignJustify, Eye, EyeOff, Check, Sparkles, RotateCcw, Save,
  Plus, BadgeCheck, Layout, Layers, ToggleLeft, Lock,
} from "lucide-react";
import type { WidgetSpan } from "../components/AdvancedAnalytics";
import { apiFetch } from "../lib/api";
import StatsGrid from "../components/dashboard/StatsGrid";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import DraggableAnalyticsGrid from "../components/DraggableAnalyticsGrid";

// ─── Types ────────────────────────────────────────────────────────────────────
export type WidgetId =
  | "stats" | "spending_trends" | "category_breakdown" | "insights"
  | "renewals" | "savings_card" | "top_expenses" | "subscriptions" | "billing_calendar";

export type StatCardId =
  | "monthly_spend" | "active_count" | "yearly_projection" | "avg_per_sub"
  | "total_savings" | "cancelled_count" | "most_expensive" | "next_renewal_days";

export type Currency = "USD" | "EUR" | "GBP";
export type Density = "comfortable" | "standard" | "compact";

export type WidgetConfig = {
  id: WidgetId; label: string; description: string;
  icon: React.ElementType; enabled: boolean; color: string;
};

export type DashboardSettings = {
  widgets: WidgetConfig[];
  layout: "grid" | "compact";   // legacy for density compat
  currency: Currency;
  density: Density;
  showQuickActions: boolean;
  statsCards: StatCardId[];
  widgetSizes: Partial<Record<WidgetId, WidgetSpan>>;
};

// Keep for dashboard/page.tsx backward compat — fixed violet/fuchsia palette
export const ACCENT_THEMES = {
  violet: { primary: "#7C3AED", secondary: "#D946EF", label: "Violet" },
} as const;
export type AccentTheme = "violet";

// Fixed palette — violet/fuchsia, not configurable
const BRAND = { primary: "#7C3AED", secondary: "#D946EF" };

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$", EUR: "€", GBP: "£",
};

export const STAT_CARD_LABELS: Record<StatCardId, string> = {
  monthly_spend:     "Monthly Spend",
  active_count:      "Active Subs",
  yearly_projection: "Yearly Projection",
  avg_per_sub:       "Avg per Sub",
  total_savings:     "Student Savings",
  cancelled_count:   "Cancelled",
  most_expensive:    "Most Expensive",
  next_renewal_days: "Next Renewal",
};

export const DEFAULT_STATS_CARDS: StatCardId[] = [
  "monthly_spend", "active_count", "yearly_projection", "avg_per_sub",
  "total_savings", "cancelled_count", "most_expensive", "next_renewal_days",
];

// Analytics widgets (sortable + resizable)
const ANALYTICS_WIDGET_IDS: WidgetId[] = [
  "savings_card", "spending_trends", "category_breakdown",
  "insights", "renewals", "billing_calendar",
];

const DEFAULT_WIDGET_SIZES: Partial<Record<WidgetId, WidgetSpan>> = {
  savings_card:       1,
  spending_trends:    2,
  category_breakdown: 2,
  insights:           1,
  renewals:           1,
  billing_calendar:   4,
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats",              label: "Statistics",         description: "Monthly spend, active subs, projections & averages", icon: Activity,      enabled: true, color: "#8B5CF6" },
  { id: "spending_trends",    label: "Spending Trends",    description: "Area chart of spending over the last 6 months",      icon: TrendingUp,    enabled: true, color: "#06B6D4" },
  { id: "category_breakdown", label: "Category Breakdown", description: "Pie chart of spending by category",                  icon: PieChart,      enabled: true, color: "#D946EF" },
  { id: "insights",           label: "Insights Panel",     description: "Smart tips and alerts based on your data",           icon: Zap,           enabled: true, color: "#F59E0B" },
  { id: "renewals",           label: "Upcoming Renewals",  description: "Subscriptions renewing in the next 30 days",         icon: Calendar,      enabled: true, color: "#10B981" },
  { id: "savings_card",       label: "Student Savings",    description: "Track your student discount savings",                icon: GraduationCap, enabled: true, color: "#EC4899" },
  { id: "billing_calendar",   label: "Billing Calendar",   description: "Monthly calendar showing billing dates",             icon: Calendar,      enabled: true, color: "#06B6D4" },
  { id: "top_expenses",       label: "Top Expenses",       description: "Bar chart of your most expensive subscriptions",     icon: BarChart2,     enabled: true, color: "#F97316" },
  { id: "subscriptions",      label: "Subscriptions List", description: "Your full subscription list and management section", icon: CreditCard,    enabled: true, color: "#6366F1" },
];

const STORAGE_KEY = "dashboard_settings_v4";

type SavedSettings = {
  widgets: { id: WidgetId; enabled: boolean }[];
  layout: "grid" | "compact";
  currency: Currency;
  density: Density;
  showQuickActions: boolean;
  statsCards: StatCardId[];
  widgetSizes: Partial<Record<WidgetId, WidgetSpan>>;
};

// ─── Settings Persistence ─────────────────────────────────────────────────────
export function loadDashboardSettings(): DashboardSettings {
  if (typeof window === "undefined") return getDefaults();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getDefaults();
    const parsed = JSON.parse(saved) as SavedSettings;
    const enabledMap: Record<string, boolean> = {};
    const savedOrder: WidgetId[] = [];
    for (const w of parsed.widgets ?? []) { enabledMap[w.id] = w.enabled; savedOrder.push(w.id); }
    const allIds = [...savedOrder, ...DEFAULT_WIDGETS.map(w => w.id).filter(id => !savedOrder.includes(id))];
    const widgets = allIds.map(id => {
      const def = DEFAULT_WIDGETS.find(w => w.id === id);
      if (!def) return null;
      return { ...def, enabled: enabledMap[id] ?? true };
    }).filter(Boolean) as WidgetConfig[];
    return {
      widgets,
      layout:           parsed.layout           ?? "grid",
      currency:         parsed.currency         ?? "USD",
      density:          parsed.density          ?? "comfortable",
      showQuickActions: parsed.showQuickActions ?? true,
      statsCards:       parsed.statsCards       ?? DEFAULT_STATS_CARDS,
      widgetSizes:      (parsed.widgetSizes as any) ?? DEFAULT_WIDGET_SIZES,
    };
  } catch { return getDefaults(); }
}

function getDefaults(): DashboardSettings {
  return {
    widgets:          DEFAULT_WIDGETS,
    layout:           "grid",
    currency:         "USD",
    density:          "comfortable",
    showQuickActions: true,
    statsCards:       DEFAULT_STATS_CARDS,
    widgetSizes:      DEFAULT_WIDGET_SIZES,
  };
}

export function saveDashboardSettings(settings: DashboardSettings) {
  const toSave: SavedSettings = {
    widgets:          settings.widgets.map(w => ({ id: w.id, enabled: w.enabled })),
    layout:           settings.layout,
    currency:         settings.currency,
    density:          settings.density,
    showQuickActions: settings.showQuickActions,
    statsCards:       settings.statsCards,
    widgetSizes:      settings.widgetSizes,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// ─── Data Types ───────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";
type Sub = {
  id: number; name: string; price_cents: number; billing_cycle: BillingCycle;
  status: Status; category: string; created_at: string;
  next_billing_date?: string; student_discount_applied?: boolean; split_with?: number;
};

function formatMoney(cents: number, currency: Currency = "USD") {
  return `${CURRENCY_SYMBOLS[currency]}${(cents / 100).toFixed(2)}`;
}

// ─── Sortable Widget Row (Analytics Only) ────────────────────────────────────
function SortableWidgetRow({ widget, onToggle, onSpanChange, widgetSizes, index, hasUnsavedChange }: {
  widget: WidgetConfig;
  onToggle: (id: WidgetId) => void;
  onSpanChange: (id: WidgetId, span: WidgetSpan) => void;
  widgetSizes: Partial<Record<WidgetId, WidgetSpan>>;
  index: number;
  hasUnsavedChange?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const Icon = widget.icon;
  const span: WidgetSpan = (widgetSizes[widget.id] as WidgetSpan) ?? 2;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-150 ${
        widget.enabled
          ? "bg-white/[0.03] border-white/8 hover:border-white/15 hover:bg-white/[0.05]"
          : "bg-black/15 border-white/[0.04] opacity-50 hover:opacity-65"
      }`}
    >
      <span className="text-[10px] font-bold text-white/15 w-4 shrink-0 text-center select-none">{index + 1}</span>
      <button {...attributes} {...listeners} className="text-white/15 hover:text-white/50 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none p-0.5">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: widget.enabled ? `${widget.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${widget.enabled ? `${widget.color}28` : "rgba(255,255,255,0.06)"}` }}>
        <Icon className="w-3 h-3" style={{ color: widget.enabled ? widget.color : "rgba(255,255,255,0.18)" }} />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <p className={`text-xs font-semibold leading-tight truncate ${widget.enabled ? "text-white" : "text-white/25"}`}>{widget.label}</p>
        {hasUnsavedChange && (
          <span title="Modified this session" style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B", flexShrink: 0, display: "inline-block" }} />
        )}
      </div>
      {/* Span selector: [1] [2] [3] [4] */}
      {widget.enabled && (
        <div className="flex gap-0.5 shrink-0">
          {([1, 2, 3, 4] as WidgetSpan[]).map(n => (
            <button
              key={n}
              onClick={() => onSpanChange(widget.id, n)}
              title={n === 1 ? "1/4 width" : n === 2 ? "2/4 width" : n === 3 ? "3/4 width" : "Full width"}
              className={`w-5 h-4 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                span === n
                  ? "bg-violet-500/30 border border-violet-500/50 text-violet-300"
                  : "bg-white/5 border border-white/10 text-white/25 hover:text-white/60"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => onToggle(widget.id)}
        className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
          widget.enabled
            ? "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
            : "text-white/20 border-white/6 hover:text-white/40 hover:bg-white/5"
        }`}
      >
        {widget.enabled ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
      </button>
    </div>
  );
}

function WidgetDragOverlay({ widget }: { widget: WidgetConfig | null }) {
  if (!widget) return null;
  const Icon = widget.icon;
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl border shadow-2xl shadow-black/60 cursor-grabbing backdrop-blur-2xl"
      style={{ width: 280, background: `linear-gradient(135deg, ${widget.color}12, rgba(0,0,0,0.8))`, borderColor: `${widget.color}40` }}>
      <GripVertical className="w-3.5 h-3.5 text-white/30 shrink-0" />
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${widget.color}20`, border: `1px solid ${widget.color}35` }}>
        <Icon className="w-3 h-3" style={{ color: widget.color }} />
      </div>
      <p className="text-xs font-semibold text-white">{widget.label}</p>
    </div>
  );
}

// ─── Pill Option (generic) ────────────────────────────────────────────────────
function PillOption({ active, onClick, icon: Icon, label, sublabel }: {
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

// ─── Section Divider ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2.5">{children}</p>;
}

// ─── Real Dashboard Preview ───────────────────────────────────────────────────
function RealDashboardPreview({ settings, subs, user, onWidgetReorder }: {
  settings: DashboardSettings;
  subs: Sub[];
  user: { is_verified: boolean; email: string } | null;
  onWidgetReorder: (newOrder: WidgetId[]) => void;
}) {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/api/analytics/trends').then(setTrendsData).catch(() => {});
    apiFetch('/api/analytics/insights').then(setInsights).catch(() => {});
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);
  const DASHBOARD_WIDTH = 1400;
  const theme = BRAND;
  const currency = settings.currency;

  useEffect(() => {
    function computeScale() {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth - 32;
        setScale(Math.min(w / DASHBOARD_WIDTH, 0.9));
      }
    }
    computeScale();
    const ro = new ResizeObserver(computeScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isWidgetEnabled = (id: string) => settings.widgets.find(w => w.id === id)?.enabled ?? true;
  const activeSubs = subs.filter(s => s.status === "active");
  const sumMonthly = activeSubs.reduce((acc, s) =>
    acc + (s.billing_cycle === "monthly" ? s.price_cents : Math.round(s.price_cents / 12)), 0);
  const avgPerSub = activeSubs.length > 0 ? sumMonthly / activeSubs.length : 0;
  const today = new Date();
  const upcomingRenewals = activeSubs
    .filter(s => s.next_billing_date)
    .map(s => { const d = new Date(s.next_billing_date!); const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); return { ...s, daysUntil: days }; })
    .filter(s => s.daysUntil >= 0 && s.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const widgetMap: Record<string, boolean> = {};
  settings.widgets.forEach(w => { widgetMap[w.id] = w.enabled; });
  const analyticsVisible = widgetMap.spending_trends || widgetMap.category_breakdown || widgetMap.savings_card || widgetMap.insights || widgetMap.renewals;

  // stats cards
  const enabledStats = settings.statsCards.filter(id => {
    return true; // all from list, take first 4
  }).slice(0, 4);

  const statCardValues: Record<StatCardId, string> = {
    monthly_spend:     formatMoney(sumMonthly, currency),
    active_count:      String(activeSubs.length),
    yearly_projection: formatMoney(sumMonthly * 12, currency),
    avg_per_sub:       formatMoney(avgPerSub, currency),
    total_savings:     formatMoney(activeSubs.filter(s => s.student_discount_applied).reduce((a) => a + 500, 0), currency),
    cancelled_count:   String(subs.filter(s => s.status === "cancelled").length),
    most_expensive:    activeSubs.length > 0 ? `${activeSubs.sort((a,b) => b.price_cents - a.price_cents)[0].name.slice(0,8)}…` : "N/A",
    next_renewal_days: upcomingRenewals.length > 0 ? `${upcomingRenewals[0].daysUntil}d` : "N/A",
  };

  const statsCardsData = enabledStats.map(id => ({ id, value: statCardValues[id] }));

  const densityGap = settings.density === "compact" ? 8 : settings.density === "standard" ? 16 : 24;
  const layoutCompact = settings.density === "compact";

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div style={{
        width: DASHBOARD_WIDTH, transformOrigin: "top left",
        transform: `scale(${scale})`,
        marginBottom: -DASHBOARD_WIDTH * (1 - scale),
        "--accent-primary": theme.primary,
        "--accent-secondary": theme.secondary,
      } as React.CSSProperties}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 mb-6 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md opacity-40" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }} />
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                <span className="text-white font-black text-sm">S</span>
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sub<span style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saver</span>
            </h1>
          </div>
          <div className="flex items-center gap-5">
            {user?.is_verified ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34D399" }}>
                <BadgeCheck size={12} /> Student Verified
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}40`, color: theme.secondary }}>
                <GraduationCap size={12} /> Verify Student
              </div>
            )}
            <span className="text-sm text-white/30">Home</span>
            <span className="text-sm text-white/30">Settings</span>
          </div>
        </div>

        {/* Quick Actions */}
        {settings.showQuickActions && (
          <div className="flex gap-3 mb-6">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 4px 15px ${theme.primary}4D` }}>
              <Plus className="w-5 h-5 text-white" />
              <span className="font-bold text-white text-sm">Add Subscription</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Layout className="w-5 h-5" style={{ color: theme.secondary }} />
              <span className="font-medium text-white/60 text-sm">Customize</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {isWidgetEnabled("stats") && subs.length > 0 && (
          <div style={{ marginBottom: densityGap }}>
            <StatsGrid cards={statsCardsData} />
          </div>
        )}

        {/* Analytics — draggable in customize preview */}
        {subs.length > 0 && analyticsVisible && (
          <div style={{ marginBottom: densityGap }}>
            <DraggableAnalyticsGrid
              widgetOrder={settings.widgets.map(w => w.id)}
              widgetSizes={settings.widgetSizes}
              widgets={widgetMap}
              onReorder={onWidgetReorder}
              upcomingRenewals={upcomingRenewals}
              trendsData={trendsData}
              insights={insights}
            />
          </div>
        )}

        {/* Subscriptions */}
        {isWidgetEnabled("subscriptions") && (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="liquid-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}30` }}>
                    <CreditCard className="w-4 h-4" style={{ color: theme.primary }} />
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

              {subs.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No subscriptions yet</p>
                </div>
              ) : layoutCompact ? (
                <div className="space-y-2">
                  {subs.map(s => {
                    const col = "#7C3AED";
                    const price = s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents;
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: `${col}18`, border: `1px solid ${col}30`, color: col }}>
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{s.name}</p>
                          <span className="text-[10px] text-white/30 capitalize">{s.billing_cycle}</span>
                        </div>
                        <div className="text-emerald-400 font-bold text-base shrink-0">{formatMoney(price, currency)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`grid gap-4 ${settings.density === "standard" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
                  {subs.map(s => {
                    const col = "#7C3AED";
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
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${s.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-gray-400 border-white/10"}`}>{s.status}</span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-400">{formatMoney(price, currency)}</div>
                        <div className="flex gap-2 mt-4">
                          {["Edit", "Pause", "Delete"].map(a => (
                            <div key={a} className="flex-1 py-2 text-center text-[10px] font-bold rounded-lg text-white/20" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{a}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <aside className="liquid-panel rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}30` }}>
                  <Plus className="w-4 h-4" style={{ color: theme.primary }} />
                </div>
                <h3 className="font-bold text-white">Add New</h3>
              </div>
              <div className="space-y-3">
                {["Service Name", "Cost", "Billing Cycle", "Category"].map(label => (
                  <div key={label}>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1.5">{label}</p>
                    <div className="h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                ))}
                <div className="mt-4 py-3 rounded-xl text-center text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 4px 15px ${theme.primary}40` }}>
                  + Add Subscription
                </div>
              </div>
            </aside>
          </div>
        )}

        {subs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}28` }}>
              <CreditCard className="w-10 h-10 opacity-50" style={{ color: theme.primary }} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomizePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<DashboardSettings>(getDefaults());
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [user, setUser] = useState<{ is_verified: boolean; email: string } | null>(null);
  // Undo stack — each entry is a full settings snapshot before the change
  const [undoStack, setUndoStack] = useState<DashboardSettings[]>([]);
  // Grid rulers toggle
  const [showGridRulers, setShowGridRulers] = useState(false);
  // Track which widget IDs had settings changed this session (for unsaved dot)
  const [changedIds, setChangedIds] = useState<Set<WidgetId>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) { router.push("/login"); return; }
    setSettings(loadDashboardSettings());
    apiFetch("/subscriptions").then(setSubs).catch(console.error);
    apiFetch("/users/me").then(setUser).catch(console.error);
  }, [router]);

  function mark(updater: (prev: DashboardSettings) => DashboardSettings, changedWidgetId?: WidgetId) {
    setSettings(prev => {
      setUndoStack(stack => [...stack.slice(-19), prev]); // keep last 20 states
      return updater(prev);
    });
    setIsDirty(true);
    if (changedWidgetId) setChangedIds(s => new Set([...s, changedWidgetId]));
  }

  function handleUndo() {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      setSettings(prev);
      setIsDirty(true);
      return stack.slice(0, -1);
    });
  }

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as WidgetId); }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    mark(prev => {
      const oi = prev.widgets.findIndex(w => w.id === active.id);
      const ni = prev.widgets.findIndex(w => w.id === over.id);
      return { ...prev, widgets: arrayMove(prev.widgets, oi, ni) };
    });
  }
  function handleToggle(id: WidgetId) {
    mark(prev => ({ ...prev, widgets: prev.widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w) }), id);
  }
  function handleSpanChange(id: WidgetId, span: WidgetSpan) {
    mark(prev => ({ ...prev, widgetSizes: { ...prev.widgetSizes, [id]: span } }), id);
  }
  function handleStatCardToggle(id: StatCardId) {
    mark(prev => {
      const already = prev.statsCards.includes(id);
      const filtered = prev.statsCards.filter(c => c !== id);
      return { ...prev, statsCards: already ? filtered : [...prev.statsCards, id] };
    });
  }
  function moveStatCard(id: StatCardId, dir: -1 | 1) {
    mark(prev => {
      const arr = [...prev.statsCards];
      const i = arr.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, statsCards: arr };
    });
  }
  function handleSave() {
    saveDashboardSettings(settings);
    setSaved(true); setIsDirty(false); setChangedIds(new Set()); setUndoStack([]);
    setTimeout(() => setSaved(false), 2500);
  }
  function handleReset() {
    const d = getDefaults();
    setSettings(d); saveDashboardSettings(d); setIsDirty(false);
    setUndoStack([]); setChangedIds(new Set());
  }

  // ── Layout Presets ──────────────────────────────────────────────────────────
  const PRESETS = [
    {
      id: "student",
      label: "Student Focus",
      icon: "🎓",
      description: "Savings & insights front and center",
      widgetOrder: ["savings_card", "insights", "spending_trends", "renewals", "category_breakdown", "billing_calendar"] as WidgetId[],
      widgetSizes: { savings_card: 2, insights: 2, spending_trends: 2, renewals: 1, category_breakdown: 1, billing_calendar: 4 } as Partial<Record<WidgetId, WidgetSpan>>,
    },
    {
      id: "budget",
      label: "Budget Mode",
      icon: "💰",
      description: "Spending & categories first",
      widgetOrder: ["spending_trends", "category_breakdown", "renewals", "savings_card", "insights", "billing_calendar"] as WidgetId[],
      widgetSizes: { spending_trends: 3, category_breakdown: 1, renewals: 2, savings_card: 2, insights: 2, billing_calendar: 4 } as Partial<Record<WidgetId, WidgetSpan>>,
    },
    {
      id: "overview",
      label: "Overview",
      icon: "📊",
      description: "Balanced view of everything",
      widgetOrder: ["spending_trends", "savings_card", "category_breakdown", "renewals", "insights", "billing_calendar"] as WidgetId[],
      widgetSizes: { spending_trends: 2, savings_card: 1, category_breakdown: 2, renewals: 1, insights: 1, billing_calendar: 4 } as Partial<Record<WidgetId, WidgetSpan>>,
    },
  ] as const;

  function handlePreset(preset: typeof PRESETS[number]) {
    mark(prev => ({
      ...prev,
      widgets: preset.widgetOrder
        .map(id => prev.widgets.find(w => w.id === id))
        .filter(Boolean)
        .concat(prev.widgets.filter(w => !preset.widgetOrder.includes(w.id as WidgetId))) as typeof prev.widgets,
      widgetSizes: { ...prev.widgetSizes, ...preset.widgetSizes },
    }));
  }

  const enabledCount = settings.widgets.filter(w => w.enabled).length;
  const totalCount = settings.widgets.length;
  const activeWidget = settings.widgets.find(w => w.id === activeId) ?? null;
  const theme = BRAND;

  return (
    <main className="min-h-screen text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #09090f 0%, #0d0b1a 50%, #080B14 100%)" }}>
      {/* Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-[140px] opacity-12" style={{ width: 700, height: 700, background: `radial-gradient(circle, ${theme.primary}, transparent 70%)`, top: -300, right: -200 }} />
        <div className="absolute rounded-full blur-[100px] opacity-8"  style={{ width: 400, height: 400, background: `radial-gradient(circle, ${theme.secondary}, transparent 70%)`, bottom: -100, left: -50 }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: "rgba(9,9,15,0.88)", backdropFilter: "blur(24px)" }}>
        <div className="px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/35 hover:text-white transition-colors text-sm group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${theme.primary}28`, border: `1px solid ${theme.primary}40` }}>
                <Sparkles className="w-3 h-3" style={{ color: theme.primary }} />
              </div>
              <h1 className="text-sm font-bold text-white">Customize Dashboard</h1>
              {isDirty && <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Unsaved</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {undoStack.length > 0 && (
              <button onClick={handleUndo} title="Undo last change" className="text-xs text-amber-400/70 hover:text-amber-300 transition-colors px-2.5 py-2 rounded-lg hover:bg-amber-400/5 flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3" /> Undo
              </button>
            )}
            <button onClick={handleReset} className="text-xs text-white/25 hover:text-white/60 transition-colors px-2.5 py-2 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3" /><span className="hidden sm:inline">Reset</span>
            </button>
            <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              saved ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : isDirty ? "text-white shadow-lg hover:opacity-90"
              : "bg-white/5 border border-white/10 text-white/30 cursor-default"
            }`} style={isDirty && !saved ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 4px 15px ${theme.primary}40` } : {}}>
              {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save</>}
            </button>
          </div>
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex" style={{ height: "calc(100vh - 56px)" }}>

        {/* LEFT: Settings sidebar */}
        <aside className="w-[320px] shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* ── 1. Density ── */}
            <div>
              <SectionLabel>Dashboard Density</SectionLabel>
              <div className="flex gap-1.5">
                <PillOption active={settings.density === "comfortable"} onClick={() => mark(p => ({ ...p, density: "comfortable", layout: "grid" }))} icon={Layers} label="Comfy" sublabel="Spacious" />
                <PillOption active={settings.density === "standard"}    onClick={() => mark(p => ({ ...p, density: "standard",    layout: "grid" }))} icon={LayoutGrid} label="Standard" sublabel="Balanced" />
                <PillOption active={settings.density === "compact"}     onClick={() => mark(p => ({ ...p, density: "compact",     layout: "compact" }))} icon={AlignJustify} label="Compact" sublabel="Dense" />
              </div>
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── Layout Presets ── */}
            <div>
              <SectionLabel>Layout Presets</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => handlePreset(p)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all border-white/6 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/14 group">
                    <span className="text-base leading-none">{p.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{p.label}</p>
                      <p className="text-[10px] text-white/25 leading-tight truncate">{p.description}</p>
                    </div>
                    <span className="ml-auto text-[9px] text-white/20 group-hover:text-violet-400 transition-colors font-bold uppercase tracking-wider">Apply →</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── 3. Currency ── */}
            <div>
              <SectionLabel>Currency Display</SectionLabel>
              <div className="flex gap-1.5">
                {(["USD", "EUR", "GBP"] as Currency[]).map(c => (
                  <button key={c} onClick={() => mark(p => ({ ...p, currency: c }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${settings.currency === c ? "border-violet-500/40 bg-violet-500/10 text-white" : "border-white/6 bg-white/[0.02] text-white/35 hover:text-white/60 hover:bg-white/[0.04]"}`}>
                    {CURRENCY_SYMBOLS[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── 4. Stats Cards ── */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <SectionLabel>Stats Cards</SectionLabel>
                <span className="text-[9px] text-white/25 font-mono">
                  {settings.statsCards.filter((_, i) => i < 4).length}/4 shown
                </span>
              </div>
              <div className="space-y-1">
                {settings.statsCards.map((id, i) => {
                  const isShown = i < 4;
                  return (
                    <div key={id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${isShown ? "border-white/8 bg-white/[0.02]" : "border-white/[0.03] bg-black/10 opacity-40"}`}>
                      <span className="text-[9px] font-bold text-white/20 w-3 shrink-0">{i + 1}</span>
                      <span className={`flex-1 text-xs font-medium truncate ${isShown ? "text-white/70" : "text-white/25"}`}>{STAT_CARD_LABELS[id]}</span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveStatCard(id, -1)} disabled={i === 0} className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">▲</button>
                        <button onClick={() => moveStatCard(id, 1)} disabled={i === settings.statsCards.length - 1} className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">▼</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-white/20 mt-2">First 4 shown on dashboard. Reorder to choose which.</p>
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── 5. Widgets ── */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <SectionLabel>Widgets</SectionLabel>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-14 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(enabledCount / totalCount) * 100}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }} />
                  </div>
                  <span className="text-[9px] text-white/25 font-mono">{enabledCount}/{totalCount}</span>
                </div>
              </div>
              <p className="text-[9px] text-white/20 mb-2">Drag to reorder · <span className="font-mono">[1][2][3]</span> = cell size</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={settings.widgets.filter(w => ANALYTICS_WIDGET_IDS.includes(w.id)).map(w => w.id)} strategy={rectSortingStrategy}>
                  <div className="space-y-1.5">
                    {/* FIXED: stats banner */}
                    {settings.widgets.filter(w => w.id === "stats" || w.id === "top_expenses").map((widget) => (
                      <div key={widget.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-black/10 opacity-60">
                        <span className="text-[10px] font-bold text-white/15 w-4 shrink-0 text-center select-none">—</span>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${widget.color}12`, border: `1px solid ${widget.color}20` }}>
                          <widget.icon className="w-3 h-3" style={{ color: widget.color }} />
                        </div>
                        <span className="flex-1 text-xs font-medium text-white/35 truncate">{widget.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white/20 bg-white/5 border border-white/8">FIXED</span>
                      </div>
                    ))}
                    {/* Separator */}
                    <p className="text-[9px] text-white/15 uppercase tracking-widest font-bold mt-2 mb-1 px-1">── Analytics (drag to reorder) ──</p>
                    {/* SORTABLE: analytics widgets */}
                    {settings.widgets.filter(w => ANALYTICS_WIDGET_IDS.includes(w.id)).map((widget, index) => (
                      <SortableWidgetRow
                        key={widget.id} widget={widget} index={index}
                        onToggle={handleToggle} onSpanChange={handleSpanChange}
                        widgetSizes={settings.widgetSizes}
                        hasUnsavedChange={changedIds.has(widget.id)}
                      />
                    ))}
                    {/* Separator */}
                    <p className="text-[9px] text-white/15 uppercase tracking-widest font-bold mt-2 mb-1 px-1">── Fixed ──</p>
                    {/* FIXED: subscriptions */}
                    {settings.widgets.filter(w => w.id === "subscriptions").map((widget) => (
                      <div key={widget.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-black/10 opacity-60">
                        <span className="text-[10px] font-bold text-white/15 w-4 shrink-0 text-center select-none">—</span>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${widget.color}12`, border: `1px solid ${widget.color}20` }}>
                          <widget.icon className="w-3 h-3" style={{ color: widget.color }} />
                        </div>
                        <span className="flex-1 text-xs font-medium text-white/35 truncate">{widget.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white/20 bg-white/5 border border-white/8">FIXED</span>
                      </div>
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
            <button onClick={handleSave} className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${saved ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" : "text-white hover:opacity-90 hover:scale-[1.01]"}`}
              style={!saved ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 4px 20px ${theme.primary}35` } : {}}>
              {saved ? <><Check className="w-4 h-4" /> All saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            <Link href="/dashboard" className="block w-full py-2.5 rounded-xl text-center text-xs font-medium text-white/30 hover:text-white/60 border border-white/6 hover:bg-white/[0.03] transition-all">
              ← Back to Dashboard
            </Link>
          </div>
        </aside>

        {/* RIGHT: Live preview */}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGridRulers(v => !v)}
                title="Toggle 4-column grid rulers"
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                  showGridRulers
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                    : "border-white/8 bg-white/[0.03] text-white/25 hover:text-white/50"
                }`}
              >
                ⊞ Grid
              </button>
              <div className="text-[10px] text-white/20 font-mono">{enabledCount} widgets</div>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-hidden relative" style={{ background: "#080B14" }}>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute rounded-full blur-[80px] opacity-10" style={{ width: 500, height: 500, background: `radial-gradient(circle, ${theme.primary}26, transparent 70%)`, top: "-5%", right: "-5%" }} />
              <div className="absolute rounded-full blur-[60px] opacity-8"  style={{ width: 400, height: 400, background: `radial-gradient(circle, ${theme.secondary}1A, transparent 70%)`, bottom: "-5%", left: "-5%" }} />
            </div>
            {/* 4-column grid rulers */}
            {showGridRulers && (
              <div className="pointer-events-none absolute inset-0 z-20" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", padding: "1rem", paddingTop: "calc(1rem + 56px)" }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ border: "1px dashed rgba(139,92,246,0.2)", borderRadius: 12, background: "rgba(124,58,237,0.03)", height: "100%" }} />
                ))}
              </div>
            )}
            <div className="relative z-10 h-full p-4">
              <RealDashboardPreview
                settings={settings}
                subs={subs}
                user={user}
                onWidgetReorder={(newOrder) => {
                  mark(prev => ({
                    ...prev,
                    widgets: newOrder
                      .map(id => prev.widgets.find(w => w.id === id))
                      .filter(Boolean) as typeof prev.widgets,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
