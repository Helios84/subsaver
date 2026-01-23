"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { GraduationCap } from "lucide-react";

interface SavingsData {
    total_saved_monthly: number;
    total_saved_yearly: number;
    potential_monthly: number;
    potential_yearly: number;
    discounts_applied: number;
    discounts_available: number;
}

export default function StudentSavingsCard() {
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

    if (loading) return <div className="glass-card rounded-2xl p-6 h-[300px] animate-pulse bg-gray-50/50"></div>;
    if (!data) return null;

    const progress = data.discounts_available > 0
        ? (data.discounts_applied / data.discounts_available) * 100
        : 0;

    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col justify-between min-h-[300px]">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        Student Savings
                    </h3>
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
                        Beta
                    </span>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-white/60 p-4 rounded-xl border border-indigo-50 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Saved</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-indigo-600">
                                ${(data.total_saved_yearly / 100).toFixed(0)}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">/year</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Potential</p>
                            <p className="text-lg font-semibold text-gray-700">${(data.potential_yearly / 100).toFixed(0)}<span className="text-xs text-gray-400 font-normal">/yr</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Monthly</p>
                            <p className="text-lg font-semibold text-gray-700">${(data.total_saved_monthly / 100).toFixed(0)}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm items-end">
                    <span className="text-gray-600 font-medium">Discounts Applied</span>
                    <span className="font-bold text-gray-900">{data.discounts_applied} <span className="text-gray-400 font-normal">/ {data.discounts_available} services</span></span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                        style={{ width: `${Math.max(5, progress)}%` }}
                    />
                </div>

                <button className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300">
                    View All Discounts
                </button>
            </div>

            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
