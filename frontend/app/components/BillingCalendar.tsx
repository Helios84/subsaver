"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";
import { CAT_COLORS as MASTER_CAT_COLORS } from "../lib/categories";
import { formatMoney as fxFormat } from "../lib/currency";
import type { Currency } from "../lib/currency";
import { shareCents } from "../lib/money";

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

// Full category color map from master list
const CAT_COLORS: Record<string, string> = MASTER_CAT_COLORS;

function subColor(name: string, category?: string) {
  if (category && CAT_COLORS[category]) return CAT_COLORS[category];
  const palette = ["#8B5CF6", "#D946EF", "#06B6D4", "#10B981", "#A78BFA", "#34D399", "#F472B6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function fmt(cents: number, split: number | undefined, currency: Currency, rates: Record<string, number>) {
  return fxFormat(shareCents(cents, split), currency, rates);
}

export default function BillingCalendar({
  subscriptions,
  span = 4,
  currency = "USD",
  fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: {
  subscriptions: Sub[];
  span?: WidgetSpan;
  currency?: Currency;
  fxRates?: Record<string, number>;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<number | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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

  const totalThisMonth = Object.values(dayMap).flat().reduce((acc, s) => {
    return acc + shareCents(s.price_cents, s.split_with);
  }, 0);

  const isToday = (day: number | null) =>
    day !== null && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  // ── SPAN 1: Upcoming list (next 3 billing dates) ──────────────────────────
  if (span === 1) {
    const upcoming = Object.entries(dayMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(0, 4);

    return (
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] flex flex-col" style={{ height: WIDGET_H }}>
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0">
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-sm font-semibold text-white">Billing</h3>
          <span className="ml-auto text-xs font-bold text-cyan-300 font-mono">{fxFormat(totalThisMonth, currency, fxRates)}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-1.5 min-h-0">
          {upcoming.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-white/30 py-6">No bills this month</div>
          ) : upcoming.map(([day, subs]) => (
            <div key={day} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-black text-cyan-300 tabular-nums w-5 shrink-0">{day}</span>
                <div className="flex gap-1 min-w-0">
                  {subs.slice(0, 2).map(s => (
                    <div key={s.id} className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: `${subColor(s.name, s.category)}25`, color: subColor(s.name, s.category) }}>
                      {s.name[0]}
                    </div>
                  ))}
                  {subs.length > 2 && <span className="text-[10px] text-white/30">+{subs.length - 2}</span>}
                </div>
              </div>
              <span className="text-xs font-bold text-white/80 font-mono shrink-0">{fmt(subs.reduce((a, s) => a + s.price_cents, 0), undefined, currency, fxRates)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── SPAN 2: Current week view ────────────────────────────────────────────
  if (span === 2) {
    // Show only current week (Mon–Sun around today)
    const todayDay = today.getDate();
    const todayDow = today.getDay(); // 0=Sun
    const weekStart = todayDay - todayDow;
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = weekStart + i;
      return d >= 1 && d <= new Date(year, month + 1, 0).getDate() ? d : null;
    });

    const weekCharges = weekDays.flatMap(d => (d !== null ? (dayMap[d] ?? []).map(s => ({ day: d, s })) : []));
    const selectedCharges = selected !== null ? (dayMap[selected] ?? []).map(s => ({ day: selected, s })) : [];
    const listed = selectedCharges.length > 0 ? selectedCharges : weekCharges;

    return (
      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] flex flex-col" style={{ height: WIDGET_H }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0" style={{ borderBottom: '1px solid rgba(6,182,212,0.12)', background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(124,58,237,0.06) 100%)' }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">This Week</h3>
          </div>
          <span className="text-xs font-bold text-cyan-300 font-mono">{fxFormat(totalThisMonth, currency, fxRates)} <span className="text-white/30 font-normal">this month</span></span>
        </div>
        {/* Week grid */}
        <div className="flex-1 px-3 py-2 min-h-0 flex flex-col">
          <div className="grid grid-cols-7 gap-1 shrink-0">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-[9px] text-white/25 text-center font-bold uppercase pb-1">{d}</div>
            ))}
            {weekDays.map((day, i) => {
              const has = day !== null && (dayMap[day]?.length ?? 0) > 0;
              const tod = isToday(day);
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 min-h-[44px] transition-all cursor-pointer"
                  style={{ background: tod ? 'rgba(124,58,237,0.15)' : has ? 'rgba(6,182,212,0.08)' : 'transparent', border: `1px solid ${tod ? 'rgba(124,58,237,0.3)' : has ? 'rgba(6,182,212,0.2)' : 'transparent'}` }}
                  onClick={() => day && setSelected(selected === day ? null : day)}>
                  <span className="text-xs font-semibold" style={{ color: tod ? '#A78BFA' : has ? '#67E8F9' : 'rgba(255,255,255,0.4)' }}>{day ?? ''}</span>
                  {has && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#67E8F9' }} />}
                </div>
              );
            })}
          </div>
          {/* Charges for the selected day, or for the whole week */}
          <div className="mt-2 pt-2 border-t border-white/5 flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5">
            {listed.length === 0 ? (
              <p className="text-xs text-white/50 text-center pt-3">No charges this week.</p>
            ) : listed.map(({ day, s }) => (
              <div key={`${day}-${s.id}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-white/50 font-mono w-5 shrink-0 text-right">{day}</span>
                <span className="text-white/85 truncate flex-1">{s.name}</span>
                <span className="text-emerald-400 font-bold font-mono shrink-0">{fmt(s.price_cents, s.split_with, currency, fxRates)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SPAN 3/4: Full calendar ───────────────────────────────────────────────
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const selectedSubs = selected !== null ? (dayMap[selected] ?? []) : [];

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] flex flex-col" style={{ height: WIDGET_H }}>
      {/* Header */}
      <div className="relative px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(124,58,237,0.08) 100%)', borderBottom: '1px solid rgba(6,182,212,0.15)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.3)' }}>
            <Calendar className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Billing Calendar</h3>
            <p className="text-[10px] text-white/35">{monthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-white/35 leading-none">This month</p>
            <p className="text-sm font-black text-cyan-300 font-mono">{fxFormat(totalThisMonth, currency, fxRates)}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month"
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-3 h-3 text-white/50" />
            </button>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="Next month"
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight className="w-3 h-3 text-white/50" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar body — scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        {/* DOW headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} className="text-[9px] font-bold text-white/20 uppercase text-center py-0.5">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            const billingSubs = day !== null ? (dayMap[day] ?? []) : [];
            const hasBilling = billingSubs.length > 0;
            const isSelected = selected === day;
            const isTodayDay = isToday(day);
            return (
              <div key={i}
                onClick={() => { if (day === null) return; setSelected(isSelected ? null : day); }}
                className="relative flex flex-col items-center justify-start rounded-md transition-all duration-100"
                style={{
                  minHeight: 34,
                  cursor: day !== null ? 'pointer' : 'default',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.15))'
                    : hasBilling ? 'rgba(6,182,212,0.07)'
                    : isTodayDay ? 'rgba(124,58,237,0.1)'
                    : 'transparent',
                  border: isSelected ? '1px solid rgba(6,182,212,0.4)'
                    : hasBilling ? '1px solid rgba(6,182,212,0.15)'
                    : isTodayDay ? '1px solid rgba(124,58,237,0.3)'
                    : '1px solid transparent',
                }}>
                {day !== null && (
                  <>
                    <span className="text-[10px] font-semibold mt-1 leading-none"
                      style={{ color: isTodayDay ? '#A78BFA' : hasBilling ? '#67E8F9' : 'rgba(255,255,255,0.4)', fontWeight: isTodayDay || hasBilling ? 700 : 500 }}>
                      {day}
                    </span>
                    {hasBilling && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                        {billingSubs.slice(0, 2).map((s) => (
                          <div key={s.id} className="w-1 h-1 rounded-full" style={{ background: subColor(s.name, s.category) }} />
                        ))}
                        {billingSubs.length > 2 && <div className="text-[7px] text-white/30">+{billingSubs.length-2}</div>}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected day details */}
        {selected !== null && selectedSubs.length > 0 && (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.04)' }}>
            <div className="px-2.5 py-1.5 border-b" style={{ borderColor: 'rgba(6,182,212,0.12)' }}>
              <span className="text-[10px] font-bold text-cyan-400">
                {new Date(year, month, selected).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {selectedSubs.map((s) => {
                const col = subColor(s.name, s.category);
                return (
                  <div key={s.id} className="px-2.5 py-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: `${col}20`, border: `1px solid ${col}30`, color: col }}>
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-xs text-white/80 truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">{fmt(s.price_cents, s.split_with, currency, fxRates)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {Object.keys(dayMap).length === 0 && (
          <div className="text-center py-2 text-white/20 text-xs">No billing dates this month</div>
        )}
      </div>
    </div>
  );
}
