"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  'savings_card', 'spending_trends', 'category_breakdown',
  'insights', 'renewals', 'billing_calendar',
];

// Default spans in the new 4-col grid
export const DEFAULT_SPANS: Partial<Record<WidgetId, WidgetSpan>> = {
  savings_card: 1,
  spending_trends: 2,
  category_breakdown: 2,
  insights: 1,
  renewals: 1,
  billing_calendar: 4,
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

  // H-D fix: re-fetch analytics when subscriptions change (B-5: watch prices+ids, not just count)
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
  }, [subsHash]); // re-fetch when any subscription data changes

  // Determine the ordered list of analytics widgets to render
  const orderedIds: WidgetId[] = widgetOrder
    ? widgetOrder.filter(id => ANALYTICS_WIDGET_IDS.includes(id))
    : ANALYTICS_WIDGET_IDS;

  function getSpan(id: WidgetId): WidgetSpan {
    return widgetSizes[id] ?? DEFAULT_SPANS[id] ?? 2;
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
      <div style={{ gridColumn: 'span 1' }}><SkeletonLoader /></div>
      <div style={{ gridColumn: 'span 2' }}><ChartSkeleton /></div>
      <div style={{ gridColumn: 'span 1' }}><SkeletonLoader /></div>
      <div style={{ gridColumn: 'span 4' }}><ChartSkeleton /></div>
    </div>
  );

  return (
    <div className="analytics-grid">
      {orderedIds.map(id => {
        if (!widgets[id]) return null;
        const span = getSpan(id);
        return (
          <div
            key={id}
            className={`analytics-widget-span-${span}`}
            style={{
              transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {renderWidget(id, span)}
          </div>
        );
      })}
    </div>
  );
}
