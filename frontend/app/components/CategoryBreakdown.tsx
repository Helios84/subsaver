"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface CategoryData {
    category: string;
    total_cents: number;
    percentage: number;
}

const CATEGORIES = [
    { value: "Entertainment", icon: "🎬", color: "#8B5CF6" }, // Violet
    { value: "Productivity", icon: "💼", color: "#F59E0B" }, // Amber
    { value: "Gaming", icon: "🎮", color: "#D946EF" }, // Fuchsia
    { value: "Utilities", icon: "🔧", color: "#3B82F6" }, // Blue
    { value: "Communication", icon: "📱", color: "#10B981" }, // Emerald
    { value: "Health & Fitness", icon: "🏋️", color: "#EC4899" }, // Pink
    { value: "Education", icon: "📚", color: "#6366F1" }, // Indigo
    { value: "Food & Delivery", icon: "🍔", color: "#F97316" }, // Orange
    { value: "Other", icon: "🎨", color: "#64748B" }, // Slate
];

export default function CategoryBreakdown({ data }: { data: CategoryData[] }) {

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

    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col border-white/10 bg-white/5 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-fuchsia-500" />
                Category Breakdown
            </h3>

            {!hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
                    <Activity className="w-10 h-10 text-white/30" />
                    <p className="text-sm text-white/50">No category data yet</p>
                    <p className="text-xs text-white/30">Add subscriptions to see breakdown</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex items-center justify-center relative" style={{ minHeight: 180 }}>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: any) => `$${value.toFixed(2)}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 font-medium uppercase">Total</p>
                            <p className="text-xl font-bold text-white">
                                ${chartData.reduce((acc, curr) => acc + curr.value, 0).toFixed(0)}/mo
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 space-y-2 overflow-y-auto pr-2 max-h-[120px] custom-scrollbar">
                {chartData.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm group hover:bg-white/5 p-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: cat.color, color: cat.color }} />
                            <span className="text-gray-300 font-medium flex items-center gap-2">
                                <span>{cat.icon}</span>
                                {cat.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-white">${cat.value.toFixed(2)}</span>
                            <span className="text-xs text-gray-500 w-8 text-right">{cat.percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
