"use client";

import { TrendingUp } from "lucide-react";

interface EmptyStateProps {
    onAddSampleData: () => void;
    onAddSubscription: () => void;
}

export default function DashboardEmptyState({ onAddSampleData, onAddSubscription }: EmptyStateProps) {
    return (
        <div className="flex items-center justify-center min-h-[500px] px-6">
            <div className="max-w-md w-full text-center">
                {/* Animated Icon */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <TrendingUp className="w-12 h-12 text-violet-400" />
                    </div>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-white mb-3">
                    No subscriptions yet
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Add the first one, or load four sample subscriptions to see how the dashboard looks with data.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={onAddSubscription}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-violet-600/20"
                    >
                        Add your first subscription
                    </button>

                    <button
                        onClick={onAddSampleData}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-all"
                    >
                        Add sample subscriptions
                    </button>
                </div>
            </div>
        </div>
    );
}
