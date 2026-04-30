"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { apiFetch } from '../lib/api';
import SpendingTrendsChart from './SpendingTrendsChart';
import CategoryBreakdown from './CategoryBreakdown';
import InsightsPanel from './InsightsPanel';
import UpcomingRenewals from './UpcomingRenewals';
import StudentSavingsCard from './StudentSavingsCard';
import SkeletonLoader, { ChartSkeleton } from './SkeletonLoader';
import BillingCalendar from './BillingCalendar';
import type { WidgetId } from '../customize/page';

// Widget span: 1 = 1/4, 2 = 2/4, 3 = 3/4, 4 = full width
export type WidgetSpan = 1 | 2 | 3 | 4;

// Universal widget height — ALL widgets share this height
export const WIDGET_H = 260;

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


export default function AdvancedAnalytics({
  upcomingRenewals,
  widgets,
  allSubscriptions,
  widgetOrder,
  widgetSizes = {},
  currency = "USD",
  fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: {
  upcomingRenewals: any[];
  widgets: Record<string, boolean>;
  allSubscriptions?: any[];
  widgetOrder?: WidgetId[];
  widgetSizes?: Partial<Record<WidgetId, WidgetSpan>>;
  currency?: import("../lib/currency").Currency;
  fxRates?: Record<string, number>;
}) {
  const router = useRouter();
  const [trendsData, setTrendsData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch analytics when subscriptions change
  const subsHash = (allSubscriptions ?? []).map(s => `${s.id}:${s.price_cents}:${s.status}`).join(',');
  useEffect(() => {
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
  }, [subsHash]);

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

  // Total span of all main widgets — placeholder fills remainder to next row-of-4
  const totalSpan = mainWidgets.reduce((s, id) => s + getSpan(id), 0);
  const remainder = totalSpan % 4;
  const placeholderSpan: WidgetSpan | null = remainder > 0 ? (4 - remainder) as WidgetSpan : null;

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
    return (
      <div key="placeholder" className={`analytics-widget-span-${span}`}>
        <Link
          href="/customize"
          className="flex flex-col items-center justify-center gap-3 w-full rounded-2xl group"
          style={{
            height: WIDGET_H,
            border: '2px dashed rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.015)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.45)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)';
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            <Plus className="w-5 h-5 text-violet-400/70 group-hover:text-violet-300 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/30 group-hover:text-white/60 transition-colors leading-none">Add Widget</p>
            <p className="text-xs text-white/20 group-hover:text-white/40 transition-colors mt-1">Open Customize</p>
          </div>
        </Link>
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
