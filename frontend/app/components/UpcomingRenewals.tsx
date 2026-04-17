"use client";
import { Calendar, Clock, CheckCircle, DollarSign } from 'lucide-react';
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";
import { formatMoney as fxFormat } from "../lib/currency";
import type { Currency } from "../lib/currency";

interface Subscription {
    id: number;
    name: string;
    price_cents: number;
    next_billing_date?: string;
    daysUntil?: number | null;
}

function formatDate(dateString?: string): string {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function urgencyStyle(days: number) {
    if (days <= 3) return { badgeBg: 'rgba(239,68,68,0.12)', badgeColor: '#FCA5A5', badgeBorder: 'rgba(239,68,68,0.25)', dot: '#F87171' };
    if (days <= 7) return { badgeBg: 'rgba(249,115,22,0.12)', badgeColor: '#FDBA74', badgeBorder: 'rgba(249,115,22,0.25)', dot: '#F97316' };
    return { badgeBg:   'rgba(124,58,237,0.12)', badgeColor: '#C4B5FD', badgeBorder: 'rgba(124,58,237,0.25)', dot: '#8B5CF6' };
}

export default function UpcomingRenewals({
    subscriptions,
    span = 1,
    currency = "USD",
    fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: {
    subscriptions: Subscription[];
    span?: WidgetSpan;
    currency?: Currency;
    fxRates?: Record<string, number>;
}) {
    const compact = span === 1;

    // Summary for the footer
    const totalUpcoming = subscriptions.reduce((sum, s) => sum + s.price_cents, 0);
    const nextRenewal   = subscriptions.length > 0 ? (subscriptions[0].daysUntil ?? 0) : null;

    return (
        <div
            className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col"
            style={{ height: WIDGET_H }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-white">
                        {compact ? 'Renewals' : 'Upcoming Renewals'}
                    </h3>
                </div>
                {subscriptions.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.25)' }}>
                        {subscriptions.length}
                    </span>
                )}
            </div>

            {subscriptions.length === 0 ? (
                // Empty state — full height
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
                    <CheckCircle className="w-7 h-7 text-emerald-400/60" />
                    <p className="text-xs text-white/40 text-center">No renewals this month 🎉</p>
                </div>
            ) : (
                <>
                    {/* Renewal rows */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 gap-1.5 flex flex-col min-h-0">
                        {subscriptions.map((sub) => {
                            const days   = sub.daysUntil ?? 0;
                            const style  = urgencyStyle(days);
                            const label  = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`;

                            if (compact) {
                                return (
                                    <div key={sub.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: style.dot }} />
                                            <span className="text-xs text-white/80 truncate font-medium">{sub.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
                                            style={{ background: style.badgeBg, color: style.badgeColor, borderColor: style.badgeBorder }}>
                                            {label}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div key={sub.id} className="flex items-center justify-between gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                            style={{ background: `${style.dot}20`, border: `1px solid ${style.dot}30`, color: style.dot }}>
                                            {sub.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-white/90 truncate">{sub.name}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-white/35 mt-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span>{formatDate(sub.next_billing_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-white font-mono">{fxFormat(sub.price_cents, currency, fxRates)}</p>
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                                            style={{ background: style.badgeBg, color: style.badgeColor, borderColor: style.badgeBorder }}>
                                            {label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── FOOTER SUMMARY — fills the bottom ── */}
                    <div
                        className="shrink-0 px-4 py-2.5 flex items-center justify-between gap-2 mt-auto"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(124,58,237,0.04)' }}
                    >
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-violet-400/60" />
                            <span className="text-[10px] text-white/30 uppercase tracking-wide">Total due</span>
                        </div>
                        <span className="text-xs font-black text-violet-300 font-mono">
                            {fxFormat(totalUpcoming, currency, fxRates)}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
