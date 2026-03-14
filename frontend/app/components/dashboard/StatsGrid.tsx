"use client";

import { DollarSign, Activity, CreditCard, TrendingUp } from "lucide-react";

type Props = {
  totalMonthly: string;
  totalActive: number;
  totalYearly: string;
  avgPerSub: string;
};

export default function StatsGrid({ totalMonthly, totalActive, totalYearly, avgPerSub }: Props) {
  const stats = [
    { label: "Monthly Spend", value: totalMonthly, icon: DollarSign, color: "#7C3AED", glow: "rgba(124,58,237,0.2)" },
    { label: "Active Subs", value: String(totalActive), icon: Activity, color: "#06B6D4", glow: "rgba(6,182,212,0.2)" },
    { label: "Yearly Projection", value: totalYearly, icon: CreditCard, color: "#10B981", glow: "rgba(16,185,129,0.2)" },
    { label: "Avg per Sub", value: avgPerSub, icon: TrendingUp, color: "#D946EF", glow: "rgba(217,70,239,0.2)" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, glow }) => (
        <div key={label} className="liquid-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
            {value}
          </p>
          <div
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: glow }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
          />
        </div>
      ))}
    </div>
  );
}
