"use client";
import { Calendar, Clock } from 'lucide-react';

interface Subscription {
    id: number;
    name: string;
    price_cents: number;
    next_billing_date?: string;
    daysUntil?: number | null; // Calculated field
}

function formatDate(dateString?: string): string {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function getRenewalBadgeColor(daysUntil: number): string {
    if (daysUntil <= 3) return "bg-red-500/20 text-red-300 border-red-500/30";
    if (daysUntil <= 7) return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    return "bg-blue-500/20 text-blue-300 border-blue-500/30";
}

export default function UpcomingRenewals({ subscriptions }: { subscriptions: Subscription[] }) {
    // Expect subscriptions to be pre-filtered and sorted by page logic

    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col border-white/10 bg-white/5 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-500" />
                Upcoming Renewals
            </h3>

            {subscriptions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-60">
                    <Calendar className="w-12 h-12 mb-3" />
                    <p>No upcoming renewals</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {subscriptions.map((sub) => {
                        const badgeClass = getRenewalBadgeColor(sub.daysUntil || 0);
                        return (
                            <div key={sub.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 font-bold text-lg shadow-sm group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-500 transition-all">
                                        {sub.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-200 group-hover:text-white transition-colors">{sub.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDate(sub.next_billing_date)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-white">${(sub.price_cents / 100).toFixed(2)}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium border ${badgeClass}`}>
                                        {sub.daysUntil === 0 ? 'Today' : sub.daysUntil === 1 ? 'Tomorrow' : `In ${sub.daysUntil} days`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
