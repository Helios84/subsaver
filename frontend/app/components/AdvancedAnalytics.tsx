"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';
import SpendingTrendsChart from './SpendingTrendsChart';
import CategoryBreakdown from './CategoryBreakdown';
import InsightsPanel from './InsightsPanel';
import UpcomingRenewals from './UpcomingRenewals';
import StudentSavingsCard from './StudentSavingsCard';
import SkeletonLoader, { ChartSkeleton } from './SkeletonLoader';
import BillingCalendar from './BillingCalendar';
import type { WidgetId, WidgetConfig } from '../customize/page';

// Widget span: 1 = 1/4, 2 = 2/4, 3 = 3/4, 4 = full width
export type WidgetSpan = 1 | 2 | 3 | 4;

// Universal widget height — ALL widgets share this height
export const WIDGET_H = 260;

// ── GRID LIMIT: 3 rows × 4 columns = 12 total span units
export const MAX_GRID_SPAN = 12;

// Ordered list of analytics-zone widget IDs (excludes stats, subscriptions, top_expenses)
export const ANALYTICS_WIDGET_IDS: WidgetId[] = [
  'spending_trends', 'savings_card', 'category_breakdown',
  'insights', 'renewals', 'billing_calendar',
];

// Widgets that are always full-width (span-4), never participate in row-filling logic
const FULL_WIDTH_WIDGETS = new Set<WidgetId>(['spending_trends', 'billing_calendar']);

// Default spans — base values, adaptive logic adjusts them at render time
export const DEFAULT_SPANS: Partial<Record<WidgetId, WidgetSpan>> = {
  spending_trends: 4,    // Full-width trend chart
  savings_card: 2,       // Half width
  category_breakdown: 2, // Half width
  insights: 1,           // Quarter (may expand adaptively)
  renewals: 1,           // Quarter (may expand adaptively)
  billing_calendar: 4,   // Full width
};

// Widget label map for chips in placeholder
const WIDGET_LABELS: Partial<Record<WidgetId, { label: string; color: string; icon: string }>> = {
  spending_trends:    { label: "Spending Trends",    color: "#06B6D4", icon: "📈" },
  category_breakdown: { label: "Category Breakdown", color: "#D946EF", icon: "🥧" },
  insights:           { label: "Insights",           color: "#F59E0B", icon: "💡" },
  renewals:           { label: "Upcoming Renewals",  color: "#10B981", icon: "🔔" },
  savings_card:       { label: "Student Savings",    color: "#EC4899", icon: "🎓" },
  billing_calendar:   { label: "Billing Calendar",   color: "#06B6D4", icon: "📅" },
};

export default function AdvancedAnalytics({
  upcomingRenewals,
  widgets,
  allSubscriptions,
  widgetOrder,
  widgetSizes = {},
  currency = "USD",
  fxRates = { USD: 1, EUR: 0.93, GBP: 0.79 },
  // H-7: accept pre-loaded data from dashboard/summary to avoid duplicate requests
  trendsDataProp,
  insightsProp,
  // New: disabled widgets for placeholder chips
  disabledWidgets = [],
}: {
  upcomingRenewals: any[];
  widgets: Record<string, boolean>;
  allSubscriptions?: any[];
  widgetOrder?: WidgetId[];
  widgetSizes?: Partial<Record<WidgetId, WidgetSpan>>;
  currency?: import("../lib/currency").Currency;
  fxRates?: Record<string, number>;
  trendsDataProp?: any;
  insightsProp?: any[];
  disabledWidgets?: Array<{ id: WidgetId; label: string; color: string }>;
}) {
  const router = useRouter();
  const [trendsData, setTrendsData] = useState<any>(trendsDataProp ?? null);
  const [insights, setInsights] = useState<any[]>(insightsProp ?? []);
  const [loading, setLoading] = useState(!trendsDataProp);

  // Sync when parent passes updated data (e.g. after subscription mutation)
  useEffect(() => {
    if (trendsDataProp) {
      setTrendsData(trendsDataProp);
      setLoading(false);
    }
    if (insightsProp) setInsights(insightsProp);
  }, [trendsDataProp, insightsProp]);

  // Re-fetch analytics only when subscriptions change AND props are NOT provided
  const subsHash = (allSubscriptions ?? []).map(s => `${s.id}:${s.price_cents}:${s.status}`).join(',');
  useEffect(() => {
    // Skip internal fetch if data was provided by parent (H-7 optimization)
    if (trendsDataProp) return;

    async function load() {
      try {
        const [t, i] = await Promise.all([
          apiFetch('/api/analytics/trends'),
          apiFetch('/api/analytics/insights'),
        ]);
        setTrendsData(t);
        setInsights(i);
      } catch (e) {
        console.error('Failed to load analytics', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [subsHash, trendsDataProp]);

  // Ordered widget IDs
  const orderedIds: WidgetId[] = widgetOrder
    ? widgetOrder.filter(id => ANALYTICS_WIDGET_IDS.includes(id))
    : ANALYTICS_WIDGET_IDS;

  // Keep original (non-expanded) spans — empty space is filled with a '+' placeholder
  function getSpan(id: WidgetId): WidgetSpan {
    return widgetSizes[id] ?? DEFAULT_SPANS[id] ?? 2;
  }

  // ── Render groups:
  //   mainWidgets: everything except billing_calendar (in user's order)
  //   calendarWidget: billing_calendar always last (span-4, doesn't affect row gaps)
  //   placeholder: fills leftover columns in last partial row of mainWidgets
  const mainWidgets = orderedIds.filter(id => widgets[id] && id !== 'billing_calendar');
  const calendarWidget = orderedIds.filter(id => widgets[id] && id === 'billing_calendar');

  // Total span of all main widgets
  const totalSpan = mainWidgets.reduce((s, id) => s + getSpan(id), 0);
  const remainder = totalSpan % 4;
  // Only show placeholder if there's leftover space AND total is under MAX_GRID_SPAN
  const placeholderSpan: WidgetSpan | null = remainder > 0 && totalSpan < MAX_GRID_SPAN
    ? (4 - remainder) as WidgetSpan
    : null;

  function renderItem(id: WidgetId) {
    const span = getSpan(id);
    return (
      <div
        key={id}
        className={`analytics-widget-span-${span}`}
        style={{ transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      >
        {renderWidget(id, span)}
      </div>
    );
  }

  function renderPlaceholder(span: WidgetSpan) {
    // Up to 3 disabled analytics widgets shown as chips
    const chips = disabledWidgets
      .filter(w => ANALYTICS_WIDGET_IDS.includes(w.id))
      .slice(0, 3);

    return (
      <div key="placeholder" className={`analytics-widget-span-${span}`}>
        <div
          style={{
            height: WIDGET_H,
            borderRadius: 20,
            border: '2px dashed rgba(124,58,237,0.20)',
            background: 'rgba(124,58,237,0.025)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(124,58,237,0.50)';
            el.style.background = 'rgba(124,58,237,0.06)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(124,58,237,0.20)';
            el.style.background = 'rgba(124,58,237,0.025)';
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 80, height: 80,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent)',
            pointerEvents: 'none',
          }} />

          {/* Top: icon + label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 14,
              background: 'rgba(124,58,237,0.14)',
              border: '1px solid rgba(124,58,237,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus style={{ width: 18, height: 18, color: '#A78BFA' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>
                Add Widget
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                {chips.length > 0 ? 'Quick-enable a widget below' : 'Open Customize to add widgets'}
              </p>
            </div>
          </div>

          {/* Disabled widget chips → click opens Customize with preselection */}
          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', width: '100%' }}>
              {chips.map(w => {
                const meta = WIDGET_LABELS[w.id];
                return (
                  <button
                    key={w.id}
                    onClick={() => router.push(`/customize?focus=${w.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                      borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: `${w.color}12`,
                      border: `1px solid ${w.color}30`,
                      color: `${w.color}CC` ,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${w.color}25`;
                      e.currentTarget.style.borderColor = `${w.color}55`;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = `${w.color}12`;
                      e.currentTarget.style.borderColor = `${w.color}30`;
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{meta?.icon ?? '📊'}</span>
                    {meta?.label ?? w.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Customize link */}
          <Link
            href="/customize"
            style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
              color: 'rgba(167,139,250,0.55)', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.55)')}
          >
            <Sparkles style={{ width: 11, height: 11 }} />
            Open Customize →
          </Link>
        </div>
      </div>
    );
  }

  function renderWidget(id: WidgetId, span: WidgetSpan): React.ReactNode {
    switch (id) {
      case 'savings_card':
        return <StudentSavingsCard span={span} currency={currency} fxRates={fxRates} />;
      case 'spending_trends':
        return trendsData?.trends
          ? <SpendingTrendsChart data={trendsData.trends} span={span} currency={currency} fxRates={fxRates} />
          : <ChartSkeleton />;
      case 'category_breakdown':
        return trendsData?.breakdown
          ? <CategoryBreakdown data={trendsData.breakdown} span={span} currency={currency} fxRates={fxRates} />
          : <ChartSkeleton />;
      case 'insights':
        return <InsightsPanel insights={insights} span={span} />;
      case 'renewals':
        return <UpcomingRenewals subscriptions={upcomingRenewals} span={span} currency={currency} fxRates={fxRates} />;
      case 'billing_calendar':
        return <BillingCalendar subscriptions={allSubscriptions ?? upcomingRenewals} span={span} currency={currency} fxRates={fxRates} />;
      default:
        return null;
    }
  }

  if (loading) return (
    <div className="analytics-grid">
      <div style={{ gridColumn: 'span 4' }}><ChartSkeleton /></div>
      <div style={{ gridColumn: 'span 2' }}><ChartSkeleton /></div>
      <div style={{ gridColumn: 'span 2' }}><SkeletonLoader /></div>
    </div>
  );

  return (
    <div className="analytics-grid">
      {/* Main widgets: spending_trends, savings_card, category_breakdown, insights, renewals (in order) */}
      {mainWidgets.map(id => renderItem(id))}

      {/* '+' placeholder fills any leftover columns in the last partial row */}
      {placeholderSpan && renderPlaceholder(placeholderSpan)}

      {/* billing_calendar always last — full-width, doesn't affect row gaps above */}
      {calendarWidget.map(id => renderItem(id))}
    </div>
  );
}
