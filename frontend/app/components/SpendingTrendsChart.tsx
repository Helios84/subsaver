"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendData {
    month: string;
    year: number;
    total_cents: number;
}

export default function SpendingTrendsChart({ data }: { data: TrendData[] }) {
    // Ensure data is sorted chronologically if not already
    const formatted = data.map(d => ({
        name: d.month,
        value: d.total_cents / 100
    }));

    const currentMonth = formatted[formatted.length - 1]?.value || 0;
    const lastMonth = formatted[formatted.length - 2]?.value || 0;
    const growth = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                    Spending Trends
                </h3>
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${growth > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs last month
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                            cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '12px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Spending']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#8B5CF6', stroke: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
