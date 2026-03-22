"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import SpendingTrendsChart from './SpendingTrendsChart';
import CategoryBreakdown from './CategoryBreakdown';
import InsightsPanel from './InsightsPanel';
import UpcomingRenewals from './UpcomingRenewals';
import StudentSavingsCard from './StudentSavingsCard';
import SkeletonLoader, { ChartSkeleton } from './SkeletonLoader';
import BillingCalendar from './BillingCalendar';

export default function AdvancedAnalytics({ upcomingRenewals, widgets, allSubscriptions }: { upcomingRenewals: any[], widgets: any, allSubscriptions?: any[] }) {
    const [trendsData, setTrendsData] = useState<any>(null);
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [t, i] = await Promise.all([
                    apiFetch('/api/analytics/trends'),
                    apiFetch('/api/analytics/insights')
                ]);
                setTrendsData(t);
                setInsights(i);
            } catch (e) {
                console.error("Failed to load analytics", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: "1.25rem" }}>
                <SkeletonLoader />
                <ChartSkeleton />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: "1.25rem" }}>
                <ChartSkeleton />
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.25rem" }}>
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Row 1: Savings & Trends */}
            <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: "1.25rem" }}>
                {widgets.savings_card && <StudentSavingsCard />}
                {widgets.spending_trends && trendsData && trendsData.trends && <SpendingTrendsChart data={trendsData.trends} />}
            </div>

            {/* Row 2: Category & Insights/Renewals */}
            <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: "1.25rem" }}>
                {widgets.category_breakdown && trendsData && trendsData.breakdown && <CategoryBreakdown data={trendsData.breakdown} />}

                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.25rem" }}>
                    {widgets.insights && <InsightsPanel insights={insights} />}
                    {widgets.renewals && <UpcomingRenewals subscriptions={upcomingRenewals} />}
                </div>
            </div>

            {/* Row 3: Billing Calendar */}
            {widgets.billing_calendar && (
                <BillingCalendar subscriptions={allSubscriptions ?? upcomingRenewals} />
            )}
        </div>
    );
}

