"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface CategoryData {
    category: string;
    total_cents: number;
    percentage: number;
}

const CATEGORIES = [
    { value: "Entertainment", icon: "🎬", color: "#DC2626" },
    { value: "Productivity", icon: "💼", color: "#F59E0B" },
    { value: "Gaming", icon: "🎮", color: "#8B5CF6" },
    { value: "Utilities", icon: "🔧", color: "#3B82F6" },
    { value: "Communication", icon: "📱", color: "#10B981" },
    { value: "Health & Fitness", icon: "🏋️", color: "#EF4444" },
    { value: "Education", icon: "📚", color: "#6366F1" },
    { value: "Food & Delivery", icon: "🍔", color: "#F97316" },
    { value: "Other", icon: "🎨", color: "#6B7280" },
];

export default function CategoryBreakdown({ data }: { data: CategoryData[] }) {

    const chartData = data.map(d => {
        const catInfo = CATEGORIES.find(c => c.value === d.category) || CATEGORIES[CATEGORIES.length - 1];
        return {
            name: d.category,
            value: d.total_cents / 100,
            color: catInfo.color,
            icon: catInfo.icon,
            percentage: d.percentage
        };
    });

    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Category Breakdown
            </h3>

            <div className="flex-1 min-h-0 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => `$${value.toFixed(2)}`}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                        <p className="text-xl font-bold text-gray-900">
                            ${chartData.reduce((acc, curr) => acc + curr.value, 0).toFixed(0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-2 overflow-y-auto pr-2 max-h-[120px] custom-scrollbar">
                {chartData.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full ring-2 ring-opacity-50 ring-offset-1" style={{ backgroundColor: cat.color, borderColor: cat.color }} />
                            <span className="text-gray-600 font-medium flex items-center gap-2">
                                <span>{cat.icon}</span>
                                {cat.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">${cat.value.toFixed(2)}</span>
                            <span className="text-xs text-gray-400 w-8 text-right">{cat.percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
