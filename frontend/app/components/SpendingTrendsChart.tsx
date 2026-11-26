"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";
import { formatMoney as fxFormat } from "../lib/currency";
import type { Currency } from "../lib/currency";

interface TrendData {
    month: string;
    year: number;
    total_cents: number;
}

export default function SpendingTrendsChart({
    data,
    span = 2,
    currency = "USD",
    fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: {
    data: TrendData[];
    span?: WidgetSpan;
    currency?: Currency;
    fxRates?: Record<string, number>;
}) {
    // Filter out months with $0 to avoid "wall of zeros"
    const allFormatted = (data || []).map(d => ({
        name: d.month,
        value: d.total_cents / 100,
        hasData: d.total_cents > 0,
    }));

    // Only show up to the last meaningful point + 1 month before it
    const lastNonZeroIndex = [...allFormatted].reverse().findIndex(d => d.value > 0);
    const trimmed = lastNonZeroIndex >= 0
        ? allFormatted.slice(Math.max(0, allFormatted.length - lastNonZeroIndex - 1 - (span >= 3 ? 5 : 3)))
        : allFormatted;

    const formatted = trimmed.length > 0 ? trimmed : allFormatted;

    const currentMonth = formatted[formatted.length - 1]?.value || 0;
    const lastMonth = formatted[formatted.length - 2]?.value || 0;
    const hasComparison = lastMonth > 0;
    const growth = hasComparison ? ((currentMonth - lastMonth) / lastMonth) * 100 : null;

    // Empty state
    if (formatted.length === 0 || !formatted.some(d => d.value > 0)) {
        return (
            <div
                className="glass-card rounded-2xl flex flex-col items-center justify-center border border-white/10 bg-white/5 backdrop-blur-xl gap-2"
                style={{ height: WIDGET_H }}
            >
                <TrendingUp className="w-8 h-8 text-white/20" />
                <p className="text-sm font-medium text-white/40">No spending data yet</p>
                <p className="text-xs text-white/25">Trends appear after your first billing cycle</p>
            </div>
        );
    }

    return (
        <div
            className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col"
            style={{ height: WIDGET_H }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    Spending Trends
                </h3>
                {hasComparison && growth !== null && Math.abs(growth) >= 0.05 && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${growth > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatted} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                            dy={6}
                        />
                        {span >= 2 && (
                            <YAxis
                                width={60}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 11 }}
                                tickFormatter={(v) => fxFormat(v * 100, currency, fxRates)}
                            />
                        )}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15,23,42,0.95)',
                                borderRadius: '10px',
                                border: '1px solid rgba(139,92,246,0.3)',
                                color: '#fff',
                                fontSize: 12,
                            }}
                            formatter={(value?: number | string) => [fxFormat(Number(value ?? 0) * 100, currency, fxRates), 'Spend']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill="url(#colorSpend)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 1.5 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
