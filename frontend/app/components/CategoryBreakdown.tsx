"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";
import { formatMoney as fxFormat } from "../lib/currency";
import type { Currency } from "../lib/currency";
import { CATEGORIES as CAT_LIST } from "../lib/categories";

interface CategoryData {
    category: string;
    total_cents: number;
    percentage: number;
}

const CATEGORIES = CAT_LIST;

export default function CategoryBreakdown({
    data,
    span = 2,
    currency = "USD",
    fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: {
    data: CategoryData[];
    span?: WidgetSpan;
    currency?: Currency;
    fxRates?: Record<string, number>;
}) {
    const chartData = (data || []).map(d => {
        const catInfo = CATEGORIES.find(c => c.value === d.category) || CATEGORIES[CATEGORIES.length - 1];
        return {
            name: d.category,
            value: d.total_cents / 100,
            color: catInfo.color,
            icon: catInfo.icon,
            percentage: d.percentage
        };
    });

    const hasData = chartData.length > 0 && chartData.some(d => d.value > 0);
    const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
    const h = `${WIDGET_H}px`;

    const donutSize = span === 1 ? { inner: 45, outer: 62, chartH: 140 } : { inner: 55, outer: 76, chartH: 190 };

    return (
        <div
            className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col"
            style={{ height: h }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0">
                <Activity className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white">Category Breakdown</h3>
            </div>

            {!hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40">
                    <Activity className="w-8 h-8 text-white/30" />
                    <p className="text-xs text-white/50">No category data yet</p>
                </div>
            ) : span === 1 ? (
                /* span=1: only donut */
                <div className="flex-1 flex items-center justify-center relative min-h-0">
                    <ResponsiveContainer width="100%" height={donutSize.chartH}>
                        <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%"
                                innerRadius={donutSize.inner} outerRadius={donutSize.outer}
                                paddingAngle={4} dataKey="value" stroke="none">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                                formatter={(value?: number | string) => fxFormat(Number(value ?? 0) * 100, currency, fxRates)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Total</p>
                            <p className="text-base font-black text-white">{fxFormat(total * 100, currency, fxRates)}</p>
                            <p className="text-[9px] text-gray-500">/mo</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* span≥2: donut + legend side by side */
                <div className="flex-1 flex gap-3 px-3 pb-3 min-h-0">
                    {/* Donut */}
                    <div className="relative flex items-center justify-center shrink-0" style={{ width: 160 }}>
                        <ResponsiveContainer width={160} height={donutSize.chartH}>
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%"
                                    innerRadius={donutSize.inner} outerRadius={donutSize.outer}
                                    paddingAngle={4} dataKey="value" stroke="none">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                                    formatter={(value?: number | string) => fxFormat(Number(value ?? 0) * 100, currency, fxRates)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Total</p>
                                <p className="text-lg font-black text-white">{fxFormat(total * 100, currency, fxRates)}</p>
                                <p className="text-[9px] text-gray-400">/mo</p>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-y-auto custom-scrollbar min-h-0">
                        {chartData.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 group">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}80` }} />
                                    <span className="text-xs text-gray-300 truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-bold text-white font-mono">{fxFormat(cat.value * 100, currency, fxRates)}</span>
                                    <span className="text-[10px] text-gray-500 w-8 text-right">{cat.percentage.toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
