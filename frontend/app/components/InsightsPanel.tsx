"use client";
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface Insight {
    type: "warning" | "info" | "success";
    title: string;
    message: string;
    action: string;
}

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
    if (insights.length === 0) return null;

    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col border-white/10 bg-white/5 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Insights & Recommendations
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' :
                            insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                                'bg-blue-500/10 border-blue-500/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full ${insight.type === 'warning' ? 'bg-red-500/20 text-red-400' :
                                    insight.type === 'success' ? 'bg-green-500/20 text-green-400' :
                                        'bg-blue-500/20 text-blue-400'
                                }`}>
                                {insight.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                    insight.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                        <Lightbulb className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-semibold ${insight.type === 'warning' ? 'text-red-200' :
                                        insight.type === 'success' ? 'text-green-200' :
                                            'text-blue-200'
                                    }`}>
                                    {insight.title}
                                </h4>
                                <p className={`text-sm mt-1 ${insight.type === 'warning' ? 'text-red-300/80' :
                                        insight.type === 'success' ? 'text-green-300/80' :
                                            'text-blue-300/80'
                                    }`}>
                                    {insight.message}
                                </p>
                                <button className={`mt-3 text-xs font-medium flex items-center gap-1 hover:underline ${insight.type === 'warning' ? 'text-red-300' :
                                        insight.type === 'success' ? 'text-green-300' :
                                            'text-blue-300'
                                    }`}>
                                    {insight.action} <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
