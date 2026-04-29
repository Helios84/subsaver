"use client";

import { Edit2, Activity, Trash2, GraduationCap, Calendar, Copy } from "lucide-react";
import { getServiceIcon } from "../../dashboard/serviceIcons";
import type { Sub, StudentDiscount } from "../../types/index";
import { CATEGORIES } from "../../lib/categories";
import { formatMoney as fxFormat } from "../../lib/currency";
import type { Currency } from "../../lib/currency";

// ── Helpers ────────────────────────────────────────────────────────────────────

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

/** Returns 0–100 representing how far through the current billing cycle we are */
function getBillingProgress(daysUntil: number | null, billingCycle: string): number {
  if (daysUntil === null) return 0;
  const total = billingCycle === "monthly" ? 30 : 365;
  const elapsed = Math.max(0, total - daysUntil);
  return Math.min(100, (elapsed / total) * 100);
}

/**
 * Deterministic colour from service name so every service gets a consistent
 * unique accent (used for icon background + price text when no SVG icon exists).
 */
function getServiceColor(name: string): string {
  const palette = [
    "#7C3AED", "#D946EF", "#06B6D4", "#10B981",
    "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
    "#F97316", "#3B82F6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ── Types ──────────────────────────────────────────────────────────────────────

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
  onDuplicate?: (s: Sub) => void;
  layoutCompact?: boolean;
  currency?: Currency;
  fxRates?: Record<string, number>;
};

// ── Component ──────────────────────────────────────────────────────────────────

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
  onDuplicate,
  layoutCompact,
  currency = "USD",
  fxRates = { USD: 1, EUR: 0.92, GBP: 0.79 },
}: Props) {
  const daysUntil = calculateDaysUntil(s.next_billing_date);
  const progress = getBillingProgress(daysUntil, s.billing_cycle);
  const accent = getServiceColor(s.name);
  const ServiceIcon = getServiceIcon(s.name);

  // Renewal urgency styles
  const urgency =
    daysUntil !== null && daysUntil <= 3 && daysUntil >= 0
      ? {
        bg: "rgba(239,68,68,0.12)", color: "#F87171", border: "rgba(239,68,68,0.3)", pulse: true,
        bar: "linear-gradient(90deg,#EF4444,#F97316)"
      }
      : daysUntil !== null && daysUntil <= 7
        ? {
          bg: "rgba(249,115,22,0.12)", color: "#FB923C", border: "rgba(249,115,22,0.3)", pulse: false,
          bar: "linear-gradient(90deg,#F97316,#FBBF24)"
        }
        : {
          bg: "rgba(99,102,241,0.12)", color: "#A5B4FC", border: "rgba(99,102,241,0.25)", pulse: false,
          bar: "linear-gradient(90deg,#7C3AED,#D946EF)"
        };

  const priceDisplay = fxFormat(
    s.split_with && s.split_with > 1 ? Math.round(s.price_cents / s.split_with) : s.price_cents,
    currency,
    fxRates,
  );

  // ── Service icon with accent colour ───────────────────────────────────────────
  const IconBlock = ({ size }: { size: "sm" | "md" }) => {
    const dim = size === "sm" ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-xl";
    const icon = size === "sm" ? "w-5 h-5" : "w-6 h-6";
    const letter = size === "sm" ? "text-sm" : "text-xl";
    return (
      <div className="relative shrink-0">
        <div className="absolute inset-0 blur-lg rounded-full" style={{ background: `${accent}40` }} />
        <div
          className={`relative ${dim} flex items-center justify-center border`}
          style={{ background: `${accent}18`, borderColor: `${accent}35` }}
        >
          {ServiceIcon
            ? <ServiceIcon className={icon} style={{ color: accent }} />
            : <span className={`font-black ${letter}`} style={{ color: accent }}>
              {s.name.charAt(0).toUpperCase()}
            </span>
          }
        </div>
      </div>
    );
  };

  // ── COMPACT LAYOUT ────────────────────────────────────────────────────────────
  if (layoutCompact) {
    return (
      <div className={`flex items-center gap-4 p-3 rounded-xl liquid-card transition-[transform,box-shadow,border-color] ${isDeleting ? "border border-red-500/30 bg-red-500/5" : ""
        }`}>
        <IconBlock size="sm" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{s.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-400"
              }`}>{s.status}</span>
            <span className="text-[11px] text-white/40 capitalize">{s.billing_cycle}</span>
          </div>
        </div>

        {/* Price */}
        <div className="font-bold text-base shrink-0" style={{ color: accent }}>{priceDisplay}</div>

        {/* Actions */}
        {!isDeleting ? (
          <div className="flex items-center gap-1 shrink-0 pl-1">
            <button onClick={() => onStartEdit(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title="Edit" aria-label={`Edit ${s.name}`}>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onToggleStatus(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title={s.status === "active" ? "Pause" : "Resume"} aria-label={s.status === "active" ? `Pause ${s.name}` : `Resume ${s.name}`}>
              <Activity className="w-3.5 h-3.5" />
            </button>
            {onDuplicate && (
              <button onClick={() => onDuplicate(s)} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all" title="Duplicate" aria-label={`Duplicate ${s.name}`}>
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button onClick={() => onConfirmDelete(s.id)} className="p-2 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete" aria-label={`Delete ${s.name}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
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

  // ── GRID CARD LAYOUT ───────────────────────────────────────────────────────────
  return (
    <div
      className="group relative rounded-xl transition-[transform,box-shadow,border-color] duration-300 liquid-card"
      style={isDeleting ? { border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.05)" } : {}}
    >
      {/* Glow overlay — needs overflow-hidden separately */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30"
          style={{ background: `radial-gradient(circle, ${accent}60, transparent)` }} />
      </div>

      {/* Student Discount Badge */}
      {discount && isVerified && (
        <div className="absolute top-3 right-3 z-10">
          {discount.already_applied ? (
            <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Applied</span>
            </div>
          ) : (
            <button
              onClick={() => onDiscountClick(discount)}
              className="px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(217,70,239,0.2))",
                border: "1px solid rgba(217,70,239,0.3)", boxShadow: "0 0 10px rgba(124,58,237,0.2)"
              }}
            >
              <GraduationCap className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">
                {discount.discount_percentage}% OFF
              </span>
            </button>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Row 1: Icon + Name + badges */}
        <div className="flex items-center gap-3 mb-4">
          <IconBlock size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">{s.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${s.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/5 text-gray-400 border border-white/10"
                }`}>{s.status}</span>
              <span className="text-[11px] font-medium text-white/40 capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                {s.billing_cycle}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Price (left) + Progress bar with days (right) */}
        <div className="grid grid-cols-2 gap-4 mb-3">

          {/* Left: price */}
          <div className="flex flex-col justify-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-md rounded-lg" style={{ background: `${accent}20` }} />
              <div className="relative text-2xl font-bold font-mono tabular-nums" style={{ color: accent }}>
                {priceDisplay}
              </div>
            </div>
            {s.split_with && s.split_with > 1 && (
              <span className="mt-1.5 text-[10px] font-semibold text-violet-300">
                ÷{s.split_with} · Total {fxFormat(s.price_cents, currency, fxRates)}
              </span>
            )}
          </div>

          {/* Right: days badge + progress bar + date */}
          <div className="flex flex-col justify-center gap-1.5">
            <div className="flex items-center justify-between gap-1">
              {/* Date */}
              <div className="flex items-center gap-1 min-w-0">
                <Calendar className="w-3 h-3 shrink-0 text-white/30" />
                <span className="text-[10px] text-white/35 truncate">
                  {s.next_billing_date ? formatDate(s.next_billing_date) : "No date"}
                </span>
              </div>
              {/* Days badge */}
              {daysUntil !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${urgency.pulse ? "animate-pulse" : ""}`}
                  style={{ background: urgency.bg, color: urgency.color, borderColor: urgency.border }}
                >
                  {daysUntil <= 0 ? "Due!" : `${daysUntil}d`}
                </span>
              )}
            </div>

            {/* Progress bar — how far through the current billing cycle */}
            {s.next_billing_date ? (
              <div
                className="relative h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
                title={`${Math.round(progress)}% through billing cycle`}
              >
                <div
                  className="absolute h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: urgency.bar }}
                />
              </div>
            ) : (
              <div className="text-[10px] text-white/20">Set a date for reminders</div>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {isDeleting && (
          <div className="flex flex-col gap-3 mb-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <span className="text-sm font-bold text-red-300 text-center">Delete this subscription?</span>
            <div className="flex gap-3">
              <button
                onClick={() => onExecuteDelete(s.id)}
                className="flex-1 px-6 py-3 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all hover:scale-[1.02]"
              >
                Yes, Delete
              </button>
              <button
                onClick={onCancelDelete}
                className="flex-1 px-6 py-3 text-sm font-semibold border-2 border-white/20 text-gray-300 rounded-xl hover:bg-white/5 transition-all hover:scale-[1.02]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons — hidden by default on desktop, revealed on hover.
            On touch devices always visible (via .card-actions-hover in globals.css) */}
        {!isDeleting && (
          <div className="card-actions-hover flex items-center gap-1 -mx-5 px-4 mt-3 pt-3 border-t border-white/[0.05] transition-opacity duration-200">
            <button
              onClick={() => onStartEdit(s)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all text-white/40 hover:text-white hover:bg-white/[0.07]"
              title="Edit"
              aria-label={`Edit ${s.name}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onToggleStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all border ${s.status === "active"
                  ? "text-white/40 hover:text-amber-300 hover:bg-amber-500/[0.08] border-transparent"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              title={s.status === "active" ? "Pause" : "Resume"}
              aria-label={s.status === "active" ? `Pause ${s.name}` : `Resume ${s.name}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{s.status === "active" ? "Pause" : "Resume"}</span>
            </button>

            {onDuplicate && (
              <button
                onClick={() => onDuplicate(s)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all text-white/40 hover:text-violet-300 hover:bg-violet-500/[0.08]"
                title="Duplicate"
                aria-label={`Duplicate ${s.name}`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            )}

            {/* Visual separator before destructive action */}
            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              onClick={() => onConfirmDelete(s.id)}
              className="p-2 text-xs rounded-xl transition-all text-red-500/40 hover:text-red-400 hover:bg-red-500/[0.08]"
              title="Delete"
              aria-label={`Delete ${s.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
