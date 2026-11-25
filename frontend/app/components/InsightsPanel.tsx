"use client";
import { Lightbulb, AlertTriangle, CheckCircle, TrendingDown, Star } from 'lucide-react';
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";

interface Insight {
    type: "warning" | "info" | "success";
    title: string;
    message: string;
    action: string;
}

const TYPE_STYLES = {
    warning: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',  title: '#FCA5A5', body: 'rgba(252,165,165,0.85)', dot: '#F87171', iconColor: '#EF4444' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', title: '#6EE7B7', body: 'rgba(110,231,183,0.85)', dot: '#34D399', iconColor: '#10B981' },
    info:    { bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', title: '#C4B5FD', body: 'rgba(196,181,253,0.85)', dot: '#A78BFA', iconColor: '#7C3AED' },
} as const;

// Tip cards shown when there is spare space at the bottom
const SPACE_TIPS = [
    { icon: <TrendingDown className="w-3.5 h-3.5" />, text: "Yearly plans are often cheaper than paying monthly." },
    { icon: <Star className="w-3.5 h-3.5" />, text: "Check the discount catalog for a student price before you renew." },
];

export default function InsightsPanel({ insights, span = 1 }: { insights: Insight[], span?: WidgetSpan }) {
    const compact = span === 1;
    const showTips = compact && insights.length <= 1;
    const showFullTips = !compact && insights.length <= 1;

    return (
        <div
            className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col"
            style={{ height: WIDGET_H }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-white">
                        {compact ? 'Insights' : 'Insights & Recommendations'}
                    </h3>
                </div>
                {insights.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(250,204,21,0.15)', color: '#FDE68A', border: '1px solid rgba(250,204,21,0.2)' }}>
                        {insights.length}
                    </span>
                )}
            </div>

            {/* Insights list */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar px-3 pb-3 gap-2 min-h-0">
                {insights.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle className="w-6 h-6 text-emerald-400/60" />
                        <p className="text-xs text-white/40 text-center">All clear — no urgent tips</p>
                    </div>
                ) : (
                    <>
                        {insights.map((insight, idx) => {
                            const s = TYPE_STYLES[insight.type];
                            if (compact) {
                                return (
                                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl"
                                        style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.dot }} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold leading-snug" style={{ color: s.title }}>{insight.title}</p>
                                            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: s.body }}>{insight.message}</p>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={idx} className="p-3 rounded-xl"
                                    style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-1 rounded-full shrink-0 mt-0.5"
                                            style={{ background: `${s.iconColor}20`, color: s.iconColor }}>
                                            {insight.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                                             insight.type === 'success' ? <CheckCircle className="w-3 h-3" /> :
                                             <Lightbulb className="w-3 h-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold" style={{ color: s.title }}>{insight.title}</h4>
                                            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: s.body }}>{insight.message}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* ── FILL: savings tips when spare space ── */}
                {(showTips || showFullTips) && SPACE_TIPS.slice(0, showTips ? 2 : 1).map((tip, i) => (
                    <div key={`tip-${i}`} className="flex items-start gap-2 p-2.5 rounded-xl"
                        style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.1)' }}>
                        <span className="text-yellow-400/60 shrink-0 mt-0.5">{tip.icon}</span>
                        <p className="text-[11px] text-white/35 leading-relaxed">{tip.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
