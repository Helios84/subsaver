"use client";

import { Sparkles, TrendingUp, Zap } from "lucide-react";

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
                    <div className="absolute -top-2 -right-2 animate-pulse">
                        <div className="w-8 h-8 bg-fuchsia-500 rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-white mb-3">
                    Welcome to SubSaver! 🎉
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    You haven't added any subscriptions yet. Let's get started by exploring the dashboard with some sample data, or jump straight in!
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={onAddSampleData}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-violet-600/20"
                    >
                        <Zap className="w-5 h-5" />
                        Try Demo Data
                    </button>

                    <button
                        onClick={onAddSubscription}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-all"
                    >
                        Add Your First Subscription
                    </button>
                </div>

                {/* Features Preview */}
                <div className="mt-12 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                    <div className="text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-xs text-gray-400">Analytics</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-1">🎓</div>
                        <div className="text-xs text-gray-400">Student Discounts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-1">💰</div>
                        <div className="text-xs text-gray-400">Save Money</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
