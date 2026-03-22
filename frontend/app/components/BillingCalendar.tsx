"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Sub = {
  id: number;
  name: string;
  price_cents: number;
  billing_cycle: string;
  status: string;
  category?: string;
  next_billing_date?: string;
  split_with?: number;
};

const CAT_COLORS: Record<string, string> = {
  Entertainment: "#7C3AED",
  Productivity: "#F59E0B",
  Gaming: "#8B5CF6",
  Utilities: "#3B82F6",
  Other: "#6B7280",
};

function subColor(name: string, category?: string) {
  if (category && CAT_COLORS[category]) return CAT_COLORS[category];
  const palette = ["#7C3AED", "#D946EF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function fmt(cents: number, split?: number) {
  const effective = split && split > 1 ? cents / split : cents;
  return `$${(effective / 100).toFixed(2)}`;
}

export default function BillingCalendar({ subscriptions }: { subscriptions: Sub[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<number | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Build map: day → list of subs billing that day
  const dayMap = useMemo(() => {
    const map: Record<number, Sub[]> = {};
    const activeSubs = subscriptions.filter((s) => s.status === "active" && s.next_billing_date);
    for (const sub of activeSubs) {
      const d = new Date(sub.next_billing_date!);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(sub);
      }
    }
    return map;
  }, [subscriptions, year, month]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number | null) =>
    day !== null && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const totalBillingThisMonth = Object.values(dayMap).flat().reduce((acc, s) => {
    const price = s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents;
    return acc + price;
  }, 0);

  const selectedSubs = selected !== null ? (dayMap[selected] ?? []) : [];

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <div
        className="relative px-5 py-4 flex items-center justify-between overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(124,58,237,0.12) 50%, rgba(16,185,129,0.08) 100%)",
          borderBottom: "1px solid rgba(6,182,212,0.2)",
        }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)" }} />

        <div className="flex items-center gap-3 relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(124,58,237,0.2))", border: "1px solid rgba(6,182,212,0.35)", boxShadow: "0 0 14px rgba(6,182,212,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#67E8F9" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Billing Calendar</h3>
            <p className="text-[11px] text-white/40">Upcoming charges this month</p>
          </div>
        </div>

        {/* Month total pill */}
        <div className="relative flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-white/35 leading-none">This month</div>
            <div className="text-base font-black text-cyan-300 font-mono tabular-nums leading-tight mt-0.5">
              {`$${(totalBillingThisMonth / 100).toFixed(2)}`}
            </div>
          </div>
          {/* Nav arrows */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            ><ChevronLeft className="w-3.5 h-3.5 text-white/50" /></button>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            ><ChevronRight className="w-3.5 h-3.5 text-white/50" /></button>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Month label */}
        <div className="text-center text-xs font-semibold text-white/40 tracking-wide uppercase">{monthLabel}</div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-[10px] font-bold text-white/20 uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const billingSubs = day !== null ? (dayMap[day] ?? []) : [];
            const hasBilling = billingSubs.length > 0;
            const isSelected = selected === day;
            const isTodayDay = isToday(day);

            return (
              <div
                key={i}
                onClick={() => {
                  if (day === null) return;
                  setSelected(isSelected ? null : day);
                }}
                className="relative flex flex-col items-center justify-start rounded-xl transition-all duration-150"
                style={{
                  minHeight: "44px",
                  cursor: day !== null ? "pointer" : "default",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.15))"
                    : hasBilling
                    ? "rgba(6,182,212,0.07)"
                    : isTodayDay
                    ? "rgba(124,58,237,0.1)"
                    : "transparent",
                  border: isSelected
                    ? "1px solid rgba(6,182,212,0.4)"
                    : hasBilling
                    ? "1px solid rgba(6,182,212,0.15)"
                    : isTodayDay
                    ? "1px solid rgba(124,58,237,0.3)"
                    : "1px solid transparent",
                }}
              >
                {day !== null && (
                  <>
                    <span
                      className="text-xs font-semibold mt-1.5 leading-none"
                      style={{
                        color: isTodayDay
                          ? "#A78BFA"
                          : hasBilling
                          ? "#67E8F9"
                          : "rgba(255,255,255,0.45)",
                        fontWeight: isTodayDay || hasBilling ? 700 : 500,
                      }}
                    >{day}</span>

                    {/* Billing dot indicators */}
                    {hasBilling && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                        {billingSubs.slice(0, 3).map((s) => (
                          <div
                            key={s.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: subColor(s.name, s.category as any) }}
                          />
                        ))}
                        {billingSubs.length > 3 && (
                          <div className="text-[8px] text-white/30 leading-none">+{billingSubs.length - 3}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected day detail */}
        {selected !== null && selectedSubs.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.04)" }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(6,182,212,0.12)" }}>
              <span className="text-[11px] font-bold text-cyan-400">
                {new Date(year, month, selected).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {selectedSubs.map((s) => {
                const col = subColor(s.name, s.category as any);
                return (
                  <div key={s.id} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: `${col}20`, border: `1px solid ${col}30`, color: col }}>
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-white/80 truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums shrink-0">
                      {fmt(s.price_cents, s.split_with)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty month message */}
        {Object.keys(dayMap).length === 0 && (
          <div className="text-center py-4 text-white/20 text-xs">No billing dates this month</div>
        )}
      </div>
    </div>
  );
}
