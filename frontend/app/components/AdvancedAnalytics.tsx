"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import SpendingTrendsChart from './SpendingTrendsChart';
import CategoryBreakdown from './CategoryBreakdown';
import InsightsPanel from './InsightsPanel';
import UpcomingRenewals from './UpcomingRenewals';
import StudentSavingsCard from './StudentSavingsCard';

export default function AdvancedAnalytics({ upcomingRenewals }: { upcomingRenewals: any[] }) {
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

    if (loading) return <div className="h-96 animate-pulse bg-gray-100 rounded-3xl mt-6"></div>;

    return (
        <div className="space-y-6 mt-6">
            {/* Row 1: Savings & Trends */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <StudentSavingsCard />
                {trendsData && <SpendingTrendsChart data={trendsData.trends} />}
            </div>

            {/* Row 2: Category & Insights/Renewals */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {trendsData && <CategoryBreakdown data={trendsData.breakdown} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InsightsPanel insights={insights} />
                    <UpcomingRenewals subscriptions={upcomingRenewals} />
                </div>
            </div>
        </div>
    );
}
