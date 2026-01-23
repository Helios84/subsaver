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
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Insights & Recommendations
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${insight.type === 'warning' ? 'bg-red-50 border-red-100' :
                            insight.type === 'success' ? 'bg-green-50 border-green-100' :
                                'bg-blue-50 border-blue-100'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full ${insight.type === 'warning' ? 'bg-red-100 text-red-600' :
                                    insight.type === 'success' ? 'bg-green-100 text-green-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {insight.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                    insight.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                        <Lightbulb className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-semibold ${insight.type === 'warning' ? 'text-red-900' :
                                        insight.type === 'success' ? 'text-green-900' :
                                            'text-blue-900'
                                    }`}>
                                    {insight.title}
                                </h4>
                                <p className={`text-sm mt-1 ${insight.type === 'warning' ? 'text-red-700' :
                                        insight.type === 'success' ? 'text-green-700' :
                                            'text-blue-700'
                                    }`}>
                                    {insight.message}
                                </p>
                                <button className={`mt-3 text-xs font-medium flex items-center gap-1 hover:underline ${insight.type === 'warning' ? 'text-red-800' :
                                        insight.type === 'success' ? 'text-green-800' :
                                            'text-blue-800'
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
