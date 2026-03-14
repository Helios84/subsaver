"use client";

import { useState } from "react";
import { Plus, Search, Activity } from "lucide-react";

type BillingCycle = "monthly" | "yearly";

const CATEGORIES = [
  { value: "Entertainment", icon: "🎬" },
  { value: "Productivity", icon: "💼" },
  { value: "Gaming", icon: "🎮" },
  { value: "Utilities", icon: "🔧" },
  { value: "Communication", icon: "📱" },
  { value: "Health & Fitness", icon: "🏋️" },
  { value: "Education", icon: "📚" },
  { value: "Food & Delivery", icon: "🍔" },
  { value: "Other", icon: "🎨" },
];

type Props = {
  msg: string;
  onSubmit: (e: React.FormEvent) => void;
  onOpenPicker: () => void;
  suggestions: any[];
  showSuggestions: boolean;
  onNameChange: (val: string) => void;
  onSuggestionSelect: (service: any) => void;
  formState: {
    name: string;
    price: string;
    cycle: BillingCycle;
    category: string;
    billingDate: string;
    isSplit: boolean;
    splitWith: number;
  };
  onFormChange: (patch: Partial<Props["formState"]>) => void;
};

export default function AddSubscriptionPanel({
  msg, onSubmit, onOpenPicker, suggestions, showSuggestions,
  onNameChange, onSuggestionSelect, formState, onFormChange,
}: Props) {
  return (
    <div className="space-y-4">
      <section id="add-new-form" className="liquid-panel rounded-2xl p-6 sticky top-24">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.25)" }}>
            <Plus className="w-4 h-4 text-fuchsia-400" />
          </div>
          <h2 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>Add New</h2>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {/* Service Name */}
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Service Name</label>
            <div className="relative">
              <div className="flex gap-2">
                <input
                  value={formState.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => onFormChange({ name: formState.name }), 200)}
                  className="liquid-input flex-1 px-4 py-3 rounded-xl text-sm"
                  placeholder="e.g. Spotify"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className="px-3 py-2 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA" }}
                  title="Browse Services"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 w-full mt-1 liquid-panel rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => onSuggestionSelect(service)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between transition-all hover:bg-white/5 border-b last:border-0"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{service.service_name}</div>
                        <div className="text-xs text-white/35">{service.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">${(service.student_price_cents / 100).toFixed(2)}</div>
                        <div className="text-[10px] text-white/25 line-through">${(service.regular_price_cents / 100).toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Cost</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-white/30 text-sm font-medium z-10">$</span>
              <input
                value={formState.price}
                onChange={(e) => onFormChange({ price: e.target.value })}
                type="number" min="0" step="0.01"
                className="liquid-input w-full py-3 rounded-xl text-sm"
                style={{ paddingLeft: "2rem", paddingRight: "1rem" }}
              />
            </div>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Billing Cycle</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
                <button key={c} type="button" onClick={() => onFormChange({ cycle: c })}
                  className="text-sm py-2 rounded-lg font-semibold transition-all capitalize"
                  style={formState.cycle === c ? { background: "linear-gradient(135deg, #7C3AED, #D946EF)", color: "white" } : { color: "rgba(255,255,255,0.35)" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Category</label>
            <select value={formState.category} onChange={(e) => onFormChange({ category: e.target.value })} className="liquid-input w-full px-4 py-3 rounded-xl text-sm">
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} style={{ backgroundColor: "#161B27", color: "white" }}>{cat.icon} {cat.value}</option>
              ))}
            </select>
          </div>

          {/* Billing Date */}
          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Next Billing Date</label>
            <input value={formState.billingDate} onChange={(e) => onFormChange({ billingDate: e.target.value })} type="date" className="liquid-input w-full px-4 py-3 rounded-xl text-sm" />
            <p className="text-[10px] text-white/25 mt-1">Optional — for email reminders</p>
          </div>

          {/* Split Cost */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Split Cost?</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={formState.isSplit} onChange={(e) => onFormChange({ isSplit: e.target.checked })} className="w-4 h-4 text-violet-400 rounded border-white/20" />
              <span className="text-sm text-gray-300">Yes, I share this subscription</span>
            </div>
            {formState.isSplit && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Number of People (including you)</label>
                <input value={formState.splitWith} onChange={(e) => onFormChange({ splitWith: parseInt(e.target.value) || 1 })} type="number" min="1" className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:bg-white/10 focus:border-violet-500 outline-none transition text-sm" />
              </div>
            )}
          </div>

          <button className="liquid-btn w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2">
            <Plus className="w-5 h-5" />
            Add Subscription
          </button>

          {msg && (
            <p className="text-xs text-violet-400 text-center p-2 rounded-lg mt-1" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              {msg}
            </p>
          )}
        </form>
      </section>

      {/* Pro Tip */}
      <div className="liquid-card rounded-2xl p-5 hidden lg:block" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.04)" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Pro Tip</h3>
        </div>
        <p className="text-xs text-white/45 leading-relaxed">
          Cancelling unused subscriptions can save you over <span className="text-emerald-400 font-semibold">$500/year</span> on average.
        </p>
      </div>
    </div>
  );
}
