"use client";

import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, rectSortingStrategy,
  sortableKeyboardCoordinates, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useCallback, useRef, useMemo, memo } from "react";
import type { WidgetId } from "../customize/page";
import type { WidgetSpan } from "./AdvancedAnalytics";
import { ANALYTICS_WIDGET_IDS, WIDGET_H } from "./AdvancedAnalytics";
import SpendingTrendsChart from "./SpendingTrendsChart";
import CategoryBreakdown from "./CategoryBreakdown";
import InsightsPanel from "./InsightsPanel";
import UpcomingRenewals from "./UpcomingRenewals";
import StudentSavingsCard from "./StudentSavingsCard";
import BillingCalendar from "./BillingCalendar";
import { ChartSkeleton } from "./SkeletonLoader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataProps {
  upcomingRenewals: any[];
  allSubscriptions?: any[];
  trendsData?: any;
  insights?: any[];
}

interface Props extends DataProps {
  widgetOrder: WidgetId[];
  widgetSizes: Partial<Record<WidgetId, WidgetSpan>>;
  widgets: Record<string, boolean>;
  onReorder: (newOrder: WidgetId[]) => void;
}

// ─── Widget metadata for placeholders ────────────────────────────────────────
const WIDGET_META: Partial<Record<WidgetId, { label: string; icon: string; color: string }>> = {
  savings_card:       { label: "Student Savings",    icon: "🎓", color: "#EC4899" },
  spending_trends:    { label: "Spending Trends",     icon: "📈", color: "#06B6D4" },
  category_breakdown: { label: "Category Breakdown",  icon: "🥧", color: "#D946EF" },
  insights:           { label: "Insights",            icon: "⚡", color: "#F59E0B" },
  renewals:           { label: "Upcoming Renewals",   icon: "📅", color: "#10B981" },
  billing_calendar:   { label: "Billing Calendar",    icon: "🗓️", color: "#06B6D4" },
};

// ─── Lightweight placeholder shown for ALL tiles during drag ──────────────────
// This prevents heavy recharts components from re-mounting on every dragOver event
// which caused the "Maximum update depth exceeded" crash.
function DragPlaceholder({ id }: { id: WidgetId }) {
  const meta = WIDGET_META[id] ?? { label: String(id), icon: "📦", color: "#8B5CF6" };
  return (
    <div style={{
      height: WIDGET_H,
      borderRadius: 16,
      border: `1.5px dashed ${meta.color}45`,
      background: `${meta.color}06`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }}>
      <span style={{ fontSize: 26, opacity: 0.3 }}>{meta.icon}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 600, letterSpacing: "0.02em" }}>
        {meta.label}
      </span>
    </div>
  );
}

// ─── Actual widget content renderer ──────────────────────────────────────────
function renderWidgetContent(id: WidgetId, span: WidgetSpan, data: DataProps): React.ReactNode {
  const { upcomingRenewals, allSubscriptions, trendsData, insights } = data;
  switch (id) {
    case "savings_card":       return <StudentSavingsCard span={span} />;
    case "spending_trends":    return trendsData?.trends    ? <SpendingTrendsChart data={trendsData.trends} span={span} />   : <ChartSkeleton />;
    case "category_breakdown": return trendsData?.breakdown ? <CategoryBreakdown data={trendsData.breakdown} span={span} /> : <ChartSkeleton />;
    case "insights":           return <InsightsPanel insights={insights ?? []} span={span} />;
    case "renewals":           return <UpcomingRenewals subscriptions={upcomingRenewals} span={span} />;
    case "billing_calendar":   return <BillingCalendar subscriptions={allSubscriptions ?? upcomingRenewals} span={span} />;
    default:                   return null;
  }
}

// ─── Memoized tile content ────────────────────────────────────────────────────
// Only re-renders when actual DATA changes — NOT when drag order / activeId changes.
// This is the key fix: recharts never re-renders mid-drag, so no setState storm.
const MemoizedTileContent = memo(
  function TileContent({ id, span, data }: { id: WidgetId; span: WidgetSpan; data: DataProps }) {
    return <>{renderWidgetContent(id, span, data)}</>;
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.span === next.span &&
    prev.data === next.data   // stable ref via useMemo below
);

// ─── Sortable tile wrapper ────────────────────────────────────────────────────
function SortableTile({ id, span, isGlobalDragActive, children }: {
  id: WidgetId; span: WidgetSpan; isGlobalDragActive: boolean; children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: `span ${span}`,
        transform: CSS.Transform.toString(transform),
        transition: transition ?? "transform 200ms cubic-bezier(0.25,0.46,0.45,0.94)",
        opacity: isDragging ? 0 : 1,
        cursor: isGlobalDragActive ? "grabbing" : "grab",
        outline: "none",
        userSelect: "none",
        touchAction: "none",
        position: "relative",
      }}
    >
      {/* "Drag to reorder" hint badge — shown on hover when idle */}
      {hovered && !isGlobalDragActive && (
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 20,
          background: "rgba(124,58,237,0.9)", backdropFilter: "blur(8px)",
          borderRadius: 8, padding: "3px 9px",
          fontSize: 10, fontWeight: 700, color: "white", letterSpacing: "0.02em",
          border: "1px solid rgba(139,92,246,0.55)",
          pointerEvents: "none", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          ↕ Drag to reorder
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Ghost in DragOverlay ─────────────────────────────────────────────────────
function DragGhost({ id, span, data }: { id: WidgetId; span: WidgetSpan; data: DataProps }) {
  return (
    <div style={{
      height: WIDGET_H, opacity: 0.65, transform: "scale(1.02)",
      pointerEvents: "none", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 20px 60px rgba(124,58,237,0.45), 0 8px 20px rgba(0,0,0,0.55)",
      border: "1.5px solid rgba(139,92,246,0.6)",
    }}>
      {renderWidgetContent(id, span, data)}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DraggableAnalyticsGrid({
  widgetOrder, widgetSizes, widgets, onReorder,
  upcomingRenewals, allSubscriptions, trendsData, insights,
}: Props) {
  const [dragOrder, setDragOrder] = useState<WidgetId[]>([]);
  const [activeId, setActiveId]   = useState<WidgetId | null>(null);
  const dragOrderRef              = useRef<WidgetId[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const getSpan = (id: WidgetId): WidgetSpan => (widgetSizes[id] as WidgetSpan) ?? 2;

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const snapshot = widgetOrder.filter(id => ANALYTICS_WIDGET_IDS.includes(id) && widgets[id]);
    dragOrderRef.current = snapshot;
    setDragOrder(snapshot);
    setActiveId(e.active.id as WidgetId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetOrder, widgets]);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const cur = dragOrderRef.current;
    const oi = cur.indexOf(e.active.id as WidgetId);
    const ni = cur.indexOf(e.over.id as WidgetId);
    if (oi === -1 || ni === -1) return;
    const next = arrayMove(cur, oi, ni);
    dragOrderRef.current = next;
    setDragOrder([...next]);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    setDragOrder([]);
    if (e.over) onReorder([...dragOrderRef.current]);
  }, [onReorder]);

  // CRITICAL: stable reference so MemoizedTileContent never re-renders during drag
  // upcomingRenewals/trendsData/insights come from parent and don't change during drag
  const dataProps = useMemo(
    () => ({ upcomingRenewals, allSubscriptions, trendsData, insights }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [upcomingRenewals, allSubscriptions, trendsData, insights]
  );

  const activeOrder    = activeId ? dragOrder : widgetOrder;
  const orderedEnabled = activeOrder.filter(id => ANALYTICS_WIDGET_IDS.includes(id) && widgets[id]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedEnabled} strategy={rectSortingStrategy}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
          {orderedEnabled.map(id => {
            const span = getSpan(id);
            return (
              <SortableTile key={id} id={id} span={span} isGlobalDragActive={!!activeId}>
                {activeId
                  // During drag: show lightweight placeholder so recharts never re-mounts
                  ? <DragPlaceholder id={id} />
                  // At rest: memoized real content (won't re-render just because order changed)
                  : <MemoizedTileContent id={id} span={span} data={dataProps} />
                }
              </SortableTile>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.25,0.46,0.45,0.94)" }}>
        {activeId
          ? <DragGhost id={activeId} span={getSpan(activeId)} data={dataProps} />
          : null}
      </DragOverlay>
    </DndContext>
  );
}
