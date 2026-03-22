"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import SpendingTrendsChart from './SpendingTrendsChart';
import CategoryBreakdown from './CategoryBreakdown';
import InsightsPanel from './InsightsPanel';
import UpcomingRenewals from './UpcomingRenewals';
import StudentSavingsCard from './StudentSavingsCard';
import SkeletonLoader, { ChartSkeleton } from './SkeletonLoader';

export default function AdvancedAnalytics({ upcomingRenewals, widgets }: { upcomingRenewals: any[], widgets: any }) {
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
        <div className="space-y-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <SkeletonLoader />
                <ChartSkeleton />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <ChartSkeleton />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Row 1: Savings & Trends */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {widgets.savings_card && <StudentSavingsCard />}
                {widgets.spending_trends && trendsData && trendsData.trends && <SpendingTrendsChart data={trendsData.trends} />}
            </div>

            {/* Row 2: Category & Insights/Renewals */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {widgets.category_breakdown && trendsData && trendsData.breakdown && <CategoryBreakdown data={trendsData.breakdown} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {widgets.insights && <InsightsPanel insights={insights} />}
                    {widgets.renewals && <UpcomingRenewals subscriptions={upcomingRenewals} />}
                </div>
            </div>
        </div>
    );
}

