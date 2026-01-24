"use client";

import { useState } from "react";
import { X, GraduationCap, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function VerificationModal({ isOpen, onClose, onSuccess }: Props) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.endsWith(".edu")) {
            setError("Please use a valid .edu email address.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiFetch("/auth/verify-edu", {
                method: "POST",
                body: JSON.stringify({ edu_email: email }),
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000); // Close after 2 seconds
        } catch (err: any) {
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                        <GraduationCap size={28} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Student Verification</h2>
                    <p className="text-blue-100 text-sm mt-1">Unlock exclusive student discounts</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're Verified!</h3>
                            <p className="text-gray-500 dark:text-gray-400">Enjoy your student savings.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    University Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="you@university.edu"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(null);
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    We'll verify your status instantly. Use your .edu email.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Status"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
