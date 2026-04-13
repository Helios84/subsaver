"use client";

import { Edit2, Activity, Trash2, GraduationCap, Calendar } from "lucide-react";
import { getServiceIcon } from "../../dashboard/serviceIcons";
import type { Sub, StudentDiscount } from "../../types/index";

const CATEGORIES = [
  { value: "Entertainment",  icon: "🎬", color: "#7C3AED" },
  { value: "Productivity",   icon: "💼", color: "#F59E0B" },
  { value: "Gaming",         icon: "🎮", color: "#8B5CF6" },
  { value: "Utilities",      icon: "🔧", color: "#3B82F6" },
  { value: "Communication",  icon: "📱", color: "#10B981" },
  { value: "Health & Fitness", icon: "🏋️", color: "#db2777" },
  { value: "Education",      icon: "📚", color: "#6366F1" },
  { value: "Food & Delivery", icon: "🍔", color: "#F97316" },
  { value: "Other",          icon: "🎨", color: "#6B7280" },
];

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calculateDaysUntil(next_billing_date?: string): number | null {
  if (!next_billing_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(next_billing_date);
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type Props = {
  sub: Sub;
  isVerified: boolean;
  discount?: StudentDiscount;
  isDeleting: boolean;
  onStartEdit: (s: Sub) => void;
  onToggleStatus: (s: Sub) => void;
  onConfirmDelete: (id: number) => void;
  onCancelDelete: () => void;
  onExecuteDelete: (id: number) => void;
  onDiscountClick: (d: StudentDiscount) => void;
  layoutCompact?: boolean;
};

export default function SubscriptionCard({
  sub: s,
  isVerified,
  discount,
  isDeleting,
  onStartEdit,
  onToggleStatus,
  onConfirmDelete,
  onCancelDelete,
  onExecuteDelete,
  onDiscountClick,
  layoutCompact,
}: Props) {
  const daysUntil = calculateDaysUntil(s.next_billing_date);

  const renewalBadgeClass =
    daysUntil !== null && daysUntil <= 3 && daysUntil >= 0
      ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
      : daysUntil !== null && daysUntil <= 7
      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
      : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";

  const ServiceIcon = getServiceIcon(s.name);

  if (layoutCompact) {
    return (
      <div
        className={`flex items-center gap-4 p-3 rounded-xl liquid-card transition-all ${
          isDeleting ? "border border-red-500/30 bg-red-500/5" : ""
        }`}
      >
        {/* Icon */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-violet-500/30 blur-lg rounded-full" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
            {ServiceIcon ? (
              <ServiceIcon className="w-5 h-5 text-violet-300" />
            ) : (
              <span className="text-violet-300 font-bold">{s.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{s.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-400"
            }`}>{s.status}</span>
            <span className="text-[11px] text-white/40 capitalize">{s.billing_cycle}</span>
          </div>
        </div>
        {/* Price */}
        <div className="text-emerald-400 font-bold text-base shrink-0">
          {formatMoney(s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents)}
        </div>
        {/* Actions */}
        {!isDeleting ? (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onStartEdit(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => onToggleStatus(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title={s.status === "active" ? "Pause" : "Resume"}><Activity className="w-3.5 h-3.5" /></button>
            <button onClick={() => onConfirmDelete(s.id)} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onExecuteDelete(s.id)} className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">Delete</button>
            <button onClick={onCancelDelete} className="px-3 py-1.5 text-xs font-semibold border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all">Cancel</button>
          </div>
        )}
      </div>
    );
  }

  // Normal grid card view
  return (
    <div
      className="group relative rounded-xl transition-all duration-300 overflow-hidden liquid-card"
      style={isDeleting ? { border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.05)" } : {}}
    >
      {/* Student Discount Badge */}
      {discount && isVerified && (
        <div className="absolute top-3 right-3 z-10">
          {discount.already_applied ? (
            <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Applied</span>
            </div>
          ) : (
            <button
              onClick={() => onDiscountClick(discount)}
              className="px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(217,70,239,0.2))", border: "1px solid rgba(217,70,239,0.3)", boxShadow: "0 0 10px rgba(124,58,237,0.2)" }}
            >
              <GraduationCap className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">{discount.discount_percentage}% OFF</span>
            </button>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Icon & Name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-violet-500/30 blur-lg rounded-full" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              {ServiceIcon ? (
                <ServiceIcon className="w-6 h-6 text-violet-300" />
              ) : (
                <span className="text-violet-300 font-bold text-xl">{s.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">{s.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                s.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-gray-400 border border-white/10"
              }`}>{s.status}</span>
              <span className="text-[11px] font-medium text-white/40 capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{s.billing_cycle}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4" style={{ minHeight: 60 }}>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-400/20 blur-md rounded-lg" />
            <div className="relative text-2xl font-bold text-green-400 font-mono tabular-nums">
              {formatMoney(s.split_with && s.split_with > 1 ? s.price_cents / s.split_with : s.price_cents)}
            </div>
          </div>
        </div>

        {/* Renewal Info */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
          <Calendar className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs font-medium text-white/40">
            {s.next_billing_date ? formatDate(s.next_billing_date) : "No date set"}
          </span>
          {s.split_with && s.split_with > 1 && (
            <span className="text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
              Split ×{s.split_with} · Total: {formatMoney(s.price_cents)}
            </span>
          )}
          {s.next_billing_date && daysUntil !== null && (
            <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${renewalBadgeClass}`}>
              {daysUntil <= 0 ? "Overdue" : `${daysUntil}d`}
            </span>
          )}
        </div>

        {/* Delete Confirmation */}
        {isDeleting && (
          <div className="flex flex-col gap-3 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <span className="text-sm font-bold text-red-300 text-center">Delete this subscription?</span>
            <div className="flex gap-3">
              <button onClick={() => onExecuteDelete(s.id)} className="flex-1 px-6 py-3.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all hover:scale-[1.02]">Yes, Delete</button>
              <button onClick={onCancelDelete} className="flex-1 px-6 py-3.5 text-sm font-semibold border-2 border-white/20 text-gray-300 rounded-xl hover:bg-white/5 transition-all hover:scale-[1.02]">Cancel</button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isDeleting && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.05]">
            <button
              onClick={() => onStartEdit(s)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all text-white/40 hover:text-white hover:bg-white/[0.07]"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" /> <span>Edit</span>
            </button>
            <button
              onClick={() => onToggleStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all border ${
                s.status === "active"
                  ? "text-white/40 hover:text-amber-300 hover:bg-amber-500/[0.08] border-transparent"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
              }`}
              title={s.status === "active" ? "Pause" : "Resume"}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{s.status === "active" ? "Pause" : "Resume"}</span>
            </button>
            <button
              onClick={() => onConfirmDelete(s.id)}
              className="ml-auto p-2 text-xs font-bold rounded-xl transition-all text-red-500/40 hover:text-red-400 hover:bg-red-500/[0.08]"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
