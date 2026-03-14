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
} from "lucide-react";

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
};

export type DashboardSettings = {
  widgets: WidgetConfig[];
  layout: "grid" | "compact";
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats", label: "Statistics", description: "Monthly spend, active subs, projections & averages", icon: Activity, enabled: true },
  { id: "spending_trends", label: "Spending Trends", description: "Area chart of spending over the last 6 months", icon: TrendingUp, enabled: true },
  { id: "category_breakdown", label: "Category Breakdown", description: "Pie chart of spending by category", icon: PieChart, enabled: true },
  { id: "insights", label: "Insights Panel", description: "Smart tips and alerts based on your data", icon: Zap, enabled: true },
  { id: "renewals", label: "Upcoming Renewals", description: "Subscriptions renewing in the next 30 days", icon: Calendar, enabled: true },
  { id: "savings_card", label: "Student Savings", description: "Track your student discount savings", icon: GraduationCap, enabled: true },
  { id: "top_expenses", label: "Top Expenses", description: "Bar chart of your most expensive subscriptions", icon: BarChart2, enabled: true },
  { id: "subscriptions", label: "Subscriptions List", description: "Your full subscription list and management section", icon: CreditCard, enabled: true },
];

const STORAGE_KEY = "dashboard_settings_v2";

// Serialized form — only stores id+enabled (no React component refs)
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

    // Include any new widget IDs added since last save
    const allIds = [
      ...savedOrder,
      ...DEFAULT_WIDGETS.map((w) => w.id).filter((id) => !savedOrder.includes(id)),
    ];

    // Always reconstruct icon from DEFAULT_WIDGETS (icons cannot be JSON-serialized)
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
  // Only serialize id+enabled — never store React component references
  const toSave: SavedSettings = {
    widgets: settings.widgets.map((w) => ({ id: w.id, enabled: w.enabled })),
    layout: settings.layout,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// ─── Sortable Widget Tile ────────────────────────────────────────────────────
function SortableWidgetTile({
  widget,
  onToggle,
}: {
  widget: WidgetConfig;
  onToggle: (id: WidgetId) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const Icon = widget.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all group cursor-default ${
        widget.enabled
          ? "bg-white/5 border-white/10 hover:border-white/20"
          : "bg-black/20 border-white/5 opacity-60"
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/20 hover:text-white/60 transition-colors cursor-grab active:cursor-grabbing p-1 -ml-1 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          widget.enabled ? "bg-violet-500/20 border border-violet-500/30" : "bg-white/5 border border-white/10"
        }`}
      >
        <Icon className={`w-5 h-5 ${widget.enabled ? "text-violet-400" : "text-white/30"}`} />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${widget.enabled ? "text-white" : "text-white/40"}`}>
          {widget.label}
        </p>
        <p className="text-xs text-white/35 truncate mt-0.5">{widget.description}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={() => onToggle(widget.id)}
        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
          widget.enabled
            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
            : "bg-white/5 text-white/30 border border-white/10 hover:bg-white/10"
        }`}
      >
        {widget.enabled ? (
          <><Eye className="w-3.5 h-3.5" /> Show</>
        ) : (
          <><EyeOff className="w-3.5 h-3.5" /> Hidden</>
        )}
      </button>
    </div>
  );
}

// ─── Main Customize Page ─────────────────────────────────────────────────────
export default function CustomizePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<DashboardSettings>({ widgets: DEFAULT_WIDGETS, layout: "grid" });
  const [saved, setSaved] = useState(false);

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
  }

  function handleToggle(id: WidgetId) {
    setSettings((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    }));
  }

  function handleLayoutChange(layout: "grid" | "compact") {
    setSettings((prev) => ({ ...prev, layout }));
  }

  function handleSave() {
    saveDashboardSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const defaults: DashboardSettings = { widgets: DEFAULT_WIDGETS, layout: "grid" };
    setSettings(defaults);
    saveDashboardSettings(defaults);
  }

  const enabledCount = settings.widgets.filter((w) => w.enabled).length;

  return (
    <main className="min-h-screen text-white pb-20 relative overflow-hidden" style={{ background: "#080B14" }}>
      {/* Aurora Background */}
      <div className="aurora-container">
        <div className="aurora-blob animate-aurora-1" style={{ width: "700px", height: "700px", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", top: "-10%", right: "-10%" }} />
        <div className="aurora-blob animate-aurora-2" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 70%)", bottom: "-10%", left: "-10%" }} />
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
              Customize Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Reset defaults
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                saved
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 hover:scale-[1.02] shadow-lg shadow-fuchsia-500/20"
              }`}
            >
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-8 space-y-8">

        {/* Layout Picker */}
        <section className="liquid-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <LayoutGrid className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>Subscription Card Layout</h2>
              <p className="text-xs text-white/35">Choose how your subscription cards are displayed</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Grid Option */}
            <button
              onClick={() => handleLayoutChange("grid")}
              className={`p-4 rounded-xl border text-left transition-all ${
                settings.layout === "grid"
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-white/10 bg-white/3 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <LayoutGrid className={`w-5 h-5 ${settings.layout === "grid" ? "text-violet-400" : "text-white/30"}`} />
                <span className={`font-bold text-sm ${settings.layout === "grid" ? "text-white" : "text-white/50"}`}>Grid View</span>
                {settings.layout === "grid" && <div className="ml-auto w-5 h-5 rounded-full bg-violet-500/30 border border-violet-500/50 flex items-center justify-center"><Check className="w-3 h-3 text-violet-400" /></div>}
              </div>
              {/* Grid preview */}
              <div className="grid grid-cols-3 gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 rounded bg-white/5 border border-white/10" />
                ))}
              </div>
              <p className="text-[11px] text-white/35 mt-2">Cards arranged in a responsive grid</p>
            </button>

            {/* Compact Option */}
            <button
              onClick={() => handleLayoutChange("compact")}
              className={`p-4 rounded-xl border text-left transition-all ${
                settings.layout === "compact"
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-white/10 bg-white/3 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <AlignJustify className={`w-5 h-5 ${settings.layout === "compact" ? "text-violet-400" : "text-white/30"}`} />
                <span className={`font-bold text-sm ${settings.layout === "compact" ? "text-white" : "text-white/50"}`}>Compact List</span>
                {settings.layout === "compact" && <div className="ml-auto w-5 h-5 rounded-full bg-violet-500/30 border border-violet-500/50 flex items-center justify-center"><Check className="w-3 h-3 text-violet-400" /></div>}
              </div>
              {/* Compact preview */}
              <div className="flex flex-col gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 rounded bg-white/5 border border-white/10 flex items-center px-2 gap-2">
                    <div className="w-4 h-4 rounded bg-white/10" />
                    <div className="flex-1 h-2 rounded bg-white/10" />
                    <div className="w-8 h-2 rounded bg-white/10" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/35 mt-2">Dense list view, more data on screen</p>
            </button>
          </div>
        </section>

        {/* Widget Order */}
        <section className="liquid-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.25)" }}>
                <GripVertical className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <h2 className="font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>Widget Order & Visibility</h2>
                <p className="text-xs text-white/35">Drag to reorder • Click to toggle visibility</p>
              </div>
            </div>
            <span className="text-xs text-white/30 font-medium">{enabledCount}/{settings.widgets.length} shown</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={settings.widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {settings.widgets.map((widget) => (
                  <SortableWidgetTile key={widget.id} widget={widget} onToggle={handleToggle} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* Save Button (bottom) */}
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 py-4 rounded-xl text-center text-sm font-semibold text-white/50 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={handleSave}
            className={`flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              saved
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-fuchsia-500/20"
            }`}
          >
            {saved ? <><Check className="w-5 h-5" /> Settings Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
