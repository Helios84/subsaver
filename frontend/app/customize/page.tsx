"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
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

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats", label: "Statistics", description: "Monthly spend, active subs, projections & averages", icon: Activity, enabled: true, color: "#8B5CF6" },
  { id: "spending_trends", label: "Spending Trends", description: "Area chart of spending over the last 6 months", icon: TrendingUp, enabled: true, color: "#06B6D4" },
  { id: "category_breakdown", label: "Category Breakdown", description: "Pie chart of spending by category", icon: PieChart, enabled: true, color: "#D946EF" },
  { id: "insights", label: "Insights Panel", description: "Smart tips and alerts based on your data", icon: Zap, enabled: true, color: "#F59E0B" },
  { id: "renewals", label: "Upcoming Renewals", description: "Subscriptions renewing in the next 30 days", icon: Calendar, enabled: true, color: "#10B981" },
  { id: "savings_card", label: "Student Savings", description: "Track your student discount savings", icon: GraduationCap, enabled: true, color: "#EC4899" },
  { id: "top_expenses", label: "Top Expenses", description: "Bar chart of your most expensive subscriptions", icon: BarChart2, enabled: true, color: "#F97316" },
  { id: "subscriptions", label: "Subscriptions List", description: "Your full subscription list and management section", icon: CreditCard, enabled: true, color: "#6366F1" },
];

const STORAGE_KEY = "dashboard_settings_v2";

// ── Serialize (no icon refs in JSON) ─────────────────────────────────────────
type SavedSettings = { widgets: { id: WidgetId; enabled: boolean }[]; layout: "grid" | "compact" };

export function loadDashboardSettings(): DashboardSettings {
  if (typeof window === "undefined") return { widgets: DEFAULT_WIDGETS, layout: "grid" };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { widgets: DEFAULT_WIDGETS, layout: "grid" };
    const parsed = JSON.parse(saved) as SavedSettings;
    const enabledMap: Record<string, boolean> = {};
    const savedOrder: WidgetId[] = [];
    for (const w of parsed.widgets) {
      enabledMap[w.id] = w.enabled;
      savedOrder.push(w.id);
    }
    const allIds = [
      ...savedOrder,
      ...DEFAULT_WIDGETS.map((w) => w.id).filter((id) => !savedOrder.includes(id)),
    ];
    const widgets = allIds
      .map((id) => {
        const def = DEFAULT_WIDGETS.find((w) => w.id === id);
        if (!def) return null;
        return { ...def, enabled: enabledMap[id] ?? true };
      })
      .filter(Boolean) as WidgetConfig[];
    return { widgets, layout: parsed.layout ?? "grid" };
  } catch {
    return { widgets: DEFAULT_WIDGETS, layout: "grid" };
  }
}

export function saveDashboardSettings(settings: DashboardSettings) {
  const toSave: SavedSettings = {
    widgets: settings.widgets.map((w) => ({ id: w.id, enabled: w.enabled })),
    layout: settings.layout,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// ── Sortable Widget Tile ──────────────────────────────────────────────────────
function SortableWidgetTile({ widget, onToggle, index }: {
  widget: WidgetConfig;
  onToggle: (id: WidgetId) => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : "auto",
  };
  const Icon = widget.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
        widget.enabled
          ? "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
          : "bg-black/20 border-white/5 opacity-50 hover:opacity-60"
      } ${isDragging ? "shadow-2xl shadow-black/40 scale-[1.02]" : ""}`}
    >
      {/* Index */}
      <span className="text-xs font-bold text-white/20 w-4 shrink-0 select-none">{index + 1}</span>

      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/15 hover:text-white/50 transition-colors cursor-grab active:cursor-grabbing p-1 shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all`}
        style={{
          background: widget.enabled ? `${widget.color}20` : "rgba(255,255,255,0.04)",
          border: `1px solid ${widget.enabled ? `${widget.color}35` : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <Icon
          className="w-4.5 h-4.5"
          style={{ color: widget.enabled ? widget.color : "rgba(255,255,255,0.2)" }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm leading-tight ${widget.enabled ? "text-white" : "text-white/30"}`}>
          {widget.label}
        </p>
        <p className="text-xs text-white/30 truncate mt-0.5 leading-tight">{widget.description}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={() => onToggle(widget.id)}
        className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
          widget.enabled
            ? "text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/30"
            : "text-white/25 hover:text-white/50 border border-white/8 hover:bg-white/5"
        }`}
      >
        {widget.enabled ? (
          <><Eye className="w-3.5 h-3.5" /> Visible</>
        ) : (
          <><EyeOff className="w-3.5 h-3.5" /> Hidden</>
        )}
      </button>
    </div>
  );
}

// ── Layout Card ───────────────────────────────────────────────────────────────
function LayoutCard({
  active,
  onClick,
  title,
  subtitle,
  icon: Icon,
  preview,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-5 rounded-2xl border text-left transition-all duration-200 group ${
        active
          ? "border-violet-500/50 bg-violet-500/[0.08]"
          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15"
      }`}
    >
      {active && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500/25 border border-violet-500/50 flex items-center justify-center">
          <Check className="w-3 h-3 text-violet-400" />
        </div>
      )}
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className={`w-4.5 h-4.5 ${active ? "text-violet-400" : "text-white/30"}`} />
        <span className={`font-bold text-sm ${active ? "text-white" : "text-white/50"}`}>{title}</span>
      </div>
      <div className="mb-3">{preview}</div>
      <p className={`text-[11px] leading-tight ${active ? "text-violet-300/60" : "text-white/25"}`}>{subtitle}</p>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomizePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<DashboardSettings>({ widgets: DEFAULT_WIDGETS, layout: "grid" });
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) { router.push("/login"); return; }
    setSettings(loadDashboardSettings());
  }, [router]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSettings((prev) => {
      const oldIndex = prev.widgets.findIndex((w) => w.id === active.id);
      const newIndex = prev.widgets.findIndex((w) => w.id === over.id);
      return { ...prev, widgets: arrayMove(prev.widgets, oldIndex, newIndex) };
    });
    setIsDirty(true);
  }

  function handleToggle(id: WidgetId) {
    setSettings((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    }));
    setIsDirty(true);
  }

  function handleLayoutChange(layout: "grid" | "compact") {
    setSettings((prev) => ({ ...prev, layout }));
    setIsDirty(true);
  }

  function handleSave() {
    saveDashboardSettings(settings);
    setSaved(true);
    setIsDirty(false);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    const defaults: DashboardSettings = { widgets: DEFAULT_WIDGETS, layout: "grid" };
    setSettings(defaults);
    saveDashboardSettings(defaults);
    setIsDirty(false);
  }

  const enabledCount = settings.widgets.filter((w) => w.enabled).length;
  const totalCount = settings.widgets.length;

  return (
    <main
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #09090f 0%, #0d0b1a 50%, #080B14 100%)" }}
    >
      {/* Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-[120px] opacity-20"
          style={{ width: 600, height: 600, background: "radial-gradient(circle, #7C3AED, transparent 70%)", top: -200, right: -100 }}
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-10"
          style={{ width: 400, height: 400, background: "radial-gradient(circle, #D946EF, transparent 70%)", bottom: -100, left: -50 }}
        />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: back + title */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <h1 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                Customize Dashboard
              </h1>
              {isDirty && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Right: reset + save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                saved
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : isDirty
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:scale-[1.02] shadow-lg shadow-fuchsia-500/25"
                  : "bg-white/5 border border-white/10 text-white/40 cursor-default"
              }`}
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* ── Layout Picker ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Subscription Card Layout
            </h2>
            <p className="text-sm text-white/35 mt-1">How subscription cards appear on your dashboard</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LayoutCard
              active={settings.layout === "grid"}
              onClick={() => handleLayoutChange("grid")}
              title="Grid View"
              subtitle="Cards arranged in a responsive grid — ideal for comparing subscriptions visually"
              icon={LayoutGrid}
              preview={
                <div className="grid grid-cols-3 gap-1.5 h-16 p-2 rounded-xl bg-black/20">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg"
                      style={{ background: settings.layout === "grid" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${settings.layout === "grid" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)"}` }}
                    />
                  ))}
                </div>
              }
            />
            <LayoutCard
              active={settings.layout === "compact"}
              onClick={() => handleLayoutChange("compact")}
              title="Compact List"
              subtitle="Dense one-line rows — see more subscriptions without scrolling"
              icon={AlignJustify}
              preview={
                <div className="flex flex-col gap-1.5 h-16 p-2 rounded-xl bg-black/20 justify-center">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-5 rounded-lg flex items-center px-2 gap-1.5"
                      style={{ background: settings.layout === "compact" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${settings.layout === "compact" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)"}` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: settings.layout === "compact" ? "#8B5CF6" : "rgba(255,255,255,0.2)" }} />
                      <div className="flex-1 h-1 rounded-full" style={{ background: settings.layout === "compact" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)" }} />
                      <div className="w-6 h-1 rounded-full" style={{ background: settings.layout === "compact" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)" }} />
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        </section>

        {/* ── Widget Divider ── */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
        </div>

        {/* ── Widget Order & Visibility ── */}
        <section>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                Widget Order & Visibility
              </h2>
              <p className="text-sm text-white/35 mt-1">Drag to reorder · click the badge to toggle visibility</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
              <span className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                {enabledCount}
                <span className="text-white/20 font-light">/{totalCount}</span>
              </span>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">visible</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(enabledCount / totalCount) * 100}%`,
                background: "linear-gradient(90deg, #7C3AED, #D946EF)",
              }}
            />
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={settings.widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {settings.widgets.map((widget, index) => (
                  <SortableWidgetTile key={widget.id} widget={widget} onToggle={handleToggle} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* ── Bottom Action Bar ── */}
        <div className="flex gap-3 pt-4 pb-8">
          <Link
            href="/dashboard"
            className="flex-1 py-4 rounded-2xl text-center text-sm font-semibold text-white/40 border border-white/8 hover:bg-white/[0.04] hover:text-white/70 transition-all"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={handleSave}
            className={`flex-1 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-200 ${
              saved
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 hover:scale-[1.01] shadow-xl shadow-fuchsia-500/20"
            }`}
          >
            {saved ? (
              <><Check className="w-5 h-5" /> All saved!</>
            ) : (
              <><Save className="w-5 h-5" /> Save Changes</>
            )}
          </button>
        </div>

      </div>
    </main>
  );
}
