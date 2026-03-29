"use client";
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { WidgetSpan } from "./AdvancedAnalytics";
import { WIDGET_H } from "./AdvancedAnalytics";

interface Insight {
    type: "warning" | "info" | "success";
    title: string;
    message: string;
    action: string;
}

const TYPE_STYLES = {
    warning: { bg: 'bg-red-500/10', border: 'border-red-500/20', title: 'text-red-200', body: 'text-red-300/70', dot: 'bg-red-400', iconBg: 'bg-red-500/20 text-red-400' },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', title: 'text-emerald-200', body: 'text-emerald-300/70', dot: 'bg-emerald-400', iconBg: 'bg-emerald-500/20 text-emerald-400' },
    info:    { bg: 'bg-violet-500/10', border: 'border-violet-500/20', title: 'text-violet-200', body: 'text-violet-300/70', dot: 'bg-violet-400', iconBg: 'bg-violet-500/20 text-violet-400' },
} as const;

export default function InsightsPanel({ insights, span = 1 }: { insights: Insight[], span?: WidgetSpan }) {
    const compact = span === 1;

    return (
        <div
            className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col"
            style={{ height: WIDGET_H }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0">
                <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white">
                    {compact ? 'Insights' : 'Insights & Recommendations'}
                </h3>
            </div>

            {/* Content */}
            {insights.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
                    <CheckCircle className="w-7 h-7 text-emerald-400/60" />
                    <p className="text-xs text-white/40 text-center">All clear — no urgent recommendations</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-2 min-h-0">
                    {insights.map((insight, idx) => {
                        const s = TYPE_STYLES[insight.type];
                        if (compact) {
                            // Compact: just a colored dot + title
                            return (
                                <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${s.bg} ${s.border}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${s.dot}`} />
                                    <p className={`text-xs font-semibold leading-snug ${s.title}`}>{insight.title}</p>
                                </div>
                            );
                        }
                        return (
                            <div key={idx} className={`p-3 rounded-xl border ${s.bg} ${s.border}`}>
                                <div className="flex items-start gap-2.5">
                                    <div className={`mt-0.5 p-1 rounded-full shrink-0 ${s.iconBg}`}>
                                        {insight.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                                         insight.type === 'success' ? <CheckCircle className="w-3 h-3" /> :
                                         <Lightbulb className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-xs font-bold ${s.title}`}>{insight.title}</h4>
                                        <p className={`text-[11px] mt-0.5 leading-relaxed ${s.body}`}>{insight.message}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
