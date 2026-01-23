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
    if (daysUntil <= 3) return "bg-red-100 text-red-700 border-red-200";
    if (daysUntil <= 7) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
}

export default function UpcomingRenewals({ subscriptions }: { subscriptions: Subscription[] }) {
    // Expect subscriptions to be pre-filtered and sorted by page logic

    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
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
                            <div key={sub.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
                                        {sub.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{sub.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDate(sub.next_billing_date)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-gray-900">${(sub.price_cents / 100).toFixed(2)}</p>
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
