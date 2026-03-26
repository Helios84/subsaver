"use client";

import {
  DollarSign, Activity, CreditCard, TrendingUp,
  GraduationCap, XCircle, Star, Clock,
} from "lucide-react";
import type { StatCardId, Currency } from "../../customize/page";

// ─── Stat Card Registry ────────────────────────────────────────────────────────
export type StatCardData = {
  id: StatCardId;
  value: string;
  badge?: string;
};

const STAT_CARD_META: Record<StatCardId, {
  label: string;
  icon: React.ElementType;
  color: string;
  glow: string;
}> = {
  monthly_spend:      { label: "Monthly Spend",     icon: DollarSign,    color: "#7C3AED", glow: "rgba(124,58,237,0.2)"  },
  active_count:       { label: "Active Subs",        icon: Activity,      color: "#06B6D4", glow: "rgba(6,182,212,0.2)"   },
  yearly_projection:  { label: "Yearly Projection",  icon: CreditCard,    color: "#10B981", glow: "rgba(16,185,129,0.2)"  },
  avg_per_sub:        { label: "Avg per Sub",         icon: TrendingUp,    color: "#D946EF", glow: "rgba(217,70,239,0.2)"  },
  total_savings:      { label: "Student Savings",    icon: GraduationCap, color: "#F59E0B", glow: "rgba(245,158,11,0.2)"  },
  cancelled_count:    { label: "Cancelled",           icon: XCircle,       color: "#6B7280", glow: "rgba(107,114,128,0.2)" },
  most_expensive:     { label: "Most Expensive",     icon: Star,          color: "#F97316", glow: "rgba(249,115,22,0.2)"  },
  next_renewal_days:  { label: "Next Renewal",        icon: Clock,         color: "#3B82F6", glow: "rgba(59,130,246,0.2)"  },
};

type Props = {
  cards: StatCardData[];
  // Legacy props for backwards compat — used when cards not provided
  totalMonthly?: string;
  totalActive?: number;
  totalYearly?: string;
  avgPerSub?: string;
};

export default function StatsGrid({ cards, totalMonthly, totalActive, totalYearly, avgPerSub }: Props) {
  // Build display list (fall back to legacy props if cards not provided)
  const displayCards: StatCardData[] = cards && cards.length > 0
    ? cards.slice(0, 4)
    : [
        { id: "monthly_spend",     value: totalMonthly    ?? "$0.00" },
        { id: "active_count",      value: String(totalActive ?? 0)   },
        { id: "yearly_projection", value: totalYearly     ?? "$0.00" },
        { id: "avg_per_sub",       value: avgPerSub       ?? "$0.00" },
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayCards.map(({ id, value, badge }) => {
        const meta = STAT_CARD_META[id];
        if (!meta) return null;
        const { label, icon: Icon, color, glow } = meta;
        return (
          <div key={id} className="liquid-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono tabular-nums">
              {value}
            </p>
            {badge && (
              <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ color, background: `${color}18`, border: `1px solid ${color}28` }}>
                {badge}
              </span>
            )}
            <div
              className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ background: glow }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
            />
          </div>
        );
      })}
    </div>
  );
}
