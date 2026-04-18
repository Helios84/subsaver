"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { GraduationCap, ArrowRight, TrendingUp } from "lucide-react";
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";
import { formatMoney as fxFormat } from "../lib/currency";
import type { Currency } from "../lib/currency";

interface SavingsData {
    total_saved_monthly: number;
    total_saved_yearly: number;
    potential_monthly: number;
    potential_yearly: number;
    discounts_applied: number;
    discounts_available: number;
}

export default function StudentSavingsCard({
    span = 2,
    currency = "USD",
    fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: {
    span?: WidgetSpan;
    currency?: Currency;
    fxRates?: Record<string, number>;
}) {
    const router = useRouter();
    const [data, setData] = useState<SavingsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await apiFetch("/api/student-discounts/savings", { method: "GET" });
                setData(res);
            } catch (e) {
                console.error("Failed to load savings", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return (
        <div className="glass-card rounded-2xl animate-pulse bg-white/5" style={{ height: WIDGET_H }} />
    );
    if (!data) return null;

    const totalDiscounts = data.discounts_applied + data.discounts_available;
    const progress = totalDiscounts > 0
        ? (data.discounts_applied / totalDiscounts) * 100
        : 0;

    // span=1: ultra-compact, just the key number + progress
    if (span === 1) {
        return (
            <div className="glass-card rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br from-violet-600/15 to-fuchsia-600/15 border border-white/10 flex flex-col justify-between backdrop-blur-xl" style={{ height: WIDGET_H }}>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-xs font-semibold text-white/70">Student Savings</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Saved / year</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                            {fxFormat(data.total_saved_yearly, currency, fxRates)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{fxFormat(data.total_saved_monthly, currency, fxRates)}<span className="text-white/30">/mo</span></p>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-white/40">
                        <span>Discounts applied</span>
                        <span className="text-white/60 font-semibold">{data.discounts_applied}/{data.discounts_available}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.max(5, progress)}%` }} />
                    </div>
                </div>

                <div className="absolute -top-8 -right-8 w-28 h-28 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
            </div>
        );
    }

    // span=2,3,4: full layout
    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-white/10 flex flex-col backdrop-blur-xl" style={{ height: WIDGET_H }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-fuchsia-400" />
                    Student Savings
                </h3>
                {span >= 3 && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Saving actively
                    </div>
                )}
            </div>

            {/* Main metric row */}
            <div className={`flex ${span >= 3 ? 'gap-6' : 'gap-4'} flex-1 min-h-0`}>
                {/* Primary: total saved */}
                <div className="flex-1 bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Total Saved</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                            {fxFormat(data.total_saved_yearly, currency, fxRates)}
                        </span>
                        <span className="text-xs text-gray-500">/yr</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{fxFormat(data.total_saved_monthly, currency, fxRates)}<span className="text-white/30">/mo</span></p>
                </div>

                {/* Secondary metrics */}
                <div className="flex flex-col gap-2 justify-center min-w-[90px]">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Potential</p>
                        <p className="text-sm font-bold text-gray-200">{fxFormat(data.potential_yearly, currency, fxRates)}<span className="text-xs text-gray-500 font-normal">/yr</span></p>
                    </div>
                    {span >= 3 && (
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Monthly</p>
                            <p className="text-sm font-bold text-gray-200">{fxFormat(data.total_saved_monthly, currency, fxRates)}<span className="text-xs text-gray-500 font-normal">/mo</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress + CTA */}
            <div className="shrink-0 mt-3 space-y-2">
                <div className="flex justify-between text-xs items-center">
                    <span className="text-gray-400">Discounts Applied</span>
                    <span className="font-bold text-white text-xs">{data.discounts_applied} <span className="text-gray-500 font-normal">/ {data.discounts_available}</span></span>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                        style={{ width: `${Math.max(5, progress)}%` }} />
                </div>
                <button
                    onClick={() => router.push('/settings#student-discounts')}
                    className="w-full py-2 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 text-white rounded-lg font-medium text-xs transition-all border border-violet-500/20 flex items-center justify-center gap-1.5">
                    View All Discounts
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
