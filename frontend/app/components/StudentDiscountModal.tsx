"use client";
import { X, ExternalLink, CheckCircle2, GraduationCap, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

type StudentDiscount = {
  id: number;
  service_name: string;
  category: string;
  regular_price_cents: number;
  student_price_cents: number;
  discount_percentage: number;
  monthly_savings_cents: number;
  annual_savings_cents: number;
  requirements: string;
  verification_method: string;
  direct_link: string;
  availability: string;
  notes: string | null;
  subscription_id?: number;
  already_applied?: boolean;
};

type Props = {
  discount: StudentDiscount;
  onApply: (subscriptionId: number) => void;
  onClose: () => void;
};

const VERIFY_LABELS: Record<string, { label: string; icon: string }> = {
  edu_email: { label: "Verify with .edu email",     icon: "✉️" },
  sheerid:   { label: "Verify via SheerID",          icon: "🛡️" },
  unidays:   { label: "Verify via UNiDAYS",           icon: "🎓" },
  manual:    { label: "Upload student ID",            icon: "📄" },
};

// Generate a deterministic color from service name initial
const LETTER_COLORS: Record<string, [string, string]> = {
  A: ["#7C3AED", "#D946EF"], B: ["#2563EB", "#7C3AED"], C: ["#06B6D4", "#3B82F6"],
  D: ["#D946EF", "#F97316"], E: ["#10B981", "#06B6D4"], F: ["#F59E0B", "#EF4444"],
  G: ["#7C3AED", "#06B6D4"], H: ["#EC4899", "#D946EF"], I: ["#3B82F6", "#06B6D4"],
  J: ["#F97316", "#F59E0B"], K: ["#10B981", "#7C3AED"], L: ["#EF4444", "#F97316"],
  M: ["#7C3AED", "#3B82F6"], N: ["#D946EF", "#7C3AED"], O: ["#F59E0B", "#10B981"],
  P: ["#EC4899", "#7C3AED"], Q: ["#06B6D4", "#10B981"], R: ["#EF4444", "#D946EF"],
  S: ["#7C3AED", "#D946EF"], T: ["#3B82F6", "#7C3AED"], U: ["#10B981", "#06B6D4"],
  V: ["#D946EF", "#EC4899"], W: ["#F97316", "#F59E0B"], X: ["#EF4444", "#F97316"],
  Y: ["#F59E0B", "#F97316"], Z: ["#7C3AED", "#3B82F6"],
};

export default function StudentDiscountModal({ discount, onApply, onClose }: Props) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [visible, setVisible] = useState(false);

  // Entry animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  const requirements = (() => {
    try { return JSON.parse(discount.requirements) as string[]; } catch { return []; }
  })();

  const monthly  = (discount.monthly_savings_cents  / 100).toFixed(2);
  const annual   = (discount.annual_savings_cents   / 100).toFixed(2);
  const regular  = (discount.regular_price_cents    / 100).toFixed(2);
  const student  = (discount.student_price_cents    / 100).toFixed(2);
  const verify   = VERIFY_LABELS[discount.verification_method] ?? { label: discount.verification_method, icon: "✅" };
  const isApplied = discount.already_applied || applied;

  const letter = (discount.service_name[0] ?? "S").toUpperCase();
  const [colorA, colorB] = LETTER_COLORS[letter] ?? ["#7C3AED", "#D946EF"];

  // Price comparison percentage (what you pay vs full price)
  const paidRatio = discount.student_price_cents / Math.max(1, discount.regular_price_cents);
  const savedRatio = 1 - paidRatio;

  const handleApply = async () => {
    if (!discount.subscription_id) return;
    setApplying(true);
    try {
      await onApply(discount.subscription_id);
      setApplied(true);
      setTimeout(() => handleClose(), 1400);
    } catch { } finally { setApplying(false); }
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.80)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "background 0.22s",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(160deg, #0C0E1E 0%, #100B20 60%, #0E0A1C 100%)",
          border: "1px solid rgba(139,92,246,0.22)",
          borderRadius: 24,
          boxShadow: `0 0 0 1px rgba(139,92,246,0.08), 0 0 60px rgba(124,58,237,0.18), 0 40px 80px rgba(0,0,0,0.75)`,
          overflow: "hidden",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease",
        }}
      >
        {/* ══ HERO HEADER ══ */}
        <div style={{
          padding: "24px 24px 20px",
          background: `linear-gradient(135deg, ${colorA}18, ${colorB}10, rgba(0,0,0,0))`,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative", overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Ambient orb */}
          <div style={{
            position: "absolute", top: -40, right: -40, width: 160, height: 160,
            borderRadius: "50%", pointerEvents: "none",
            background: `radial-gradient(circle, ${colorA}30, transparent 70%)`,
            filter: "blur(30px)",
          }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Service avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  position: "absolute", inset: -3, borderRadius: 20, opacity: 0.5,
                  background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
                  filter: "blur(10px)",
                }} />
                <div style={{
                  position: "relative", width: 56, height: 56, borderRadius: 18,
                  background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 900, color: "white",
                  fontFamily: "var(--font-syne, sans-serif)",
                  boxShadow: `0 8px 24px ${colorA}50`,
                }}>
                  {letter}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "white", fontFamily: "var(--font-syne, sans-serif)", lineHeight: 1 }}>
                    {discount.service_name}
                  </span>
                  {/* Discount badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 100,
                    background: `linear-gradient(135deg, ${colorA}35, ${colorB}25)`,
                    color: colorB, border: `1px solid ${colorA}40`,
                    letterSpacing: "0.04em",
                  }}>
                    {discount.discount_percentage}% OFF
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <GraduationCap style={{ width: 12, height: 12, color: "rgba(255,255,255,0.35)" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>
                    Student Discount · {discount.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <X style={{ width: 15, height: 15, color: "rgba(255,255,255,0.45)" }} />
            </button>
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ══ */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>

          {/* ══ SAVINGS CARD ══ */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>
              Your Savings
            </p>

            {/* Main numbers */}
            <div style={{
              background: `linear-gradient(135deg, ${colorA}10, ${colorB}06)`,
              border: `1px solid ${colorA}20`,
              borderRadius: 16, padding: "16px 20px", marginBottom: 14,
            }}>
              <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Per Month</p>
                  <p style={{
                    fontSize: 32, fontWeight: 900, lineHeight: 1,
                    background: `linear-gradient(135deg, ${colorA === "#7C3AED" ? "#C084FC" : colorA}, ${colorB === "#D946EF" ? "#E879F9" : colorB})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    ${monthly}
                  </p>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.07)", alignSelf: "stretch" }} />
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Per Year</p>
                  <p style={{
                    fontSize: 32, fontWeight: 900, lineHeight: 1,
                    background: `linear-gradient(135deg, ${colorA === "#7C3AED" ? "#C084FC" : colorA}, ${colorB === "#D946EF" ? "#E879F9" : colorB})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    ${annual}
                  </p>
                </div>
              </div>

              {/* Price comparison visual */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", textDecoration: "line-through" }}>${regular}/mo</span>
                    <ArrowRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.2)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>${student}/mo</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 100,
                    background: "rgba(16,185,129,0.15)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)",
                  }}>
                    Save {Math.round(savedRatio * 100)}%
                  </span>
                </div>
                {/* Visual bar */}
                <div style={{ height: 6, borderRadius: 100, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 100,
                    width: `${Math.round(savedRatio * 100)}%`,
                    background: `linear-gradient(90deg, #10B981, #34D399)`,
                    boxShadow: "0 0 8px rgba(52,211,153,0.5)",
                    transition: "width 0.8s cubic-bezier(0.34,1.2,0.64,1)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Student price</span>
                  <span style={{ fontSize: 9, color: "rgba(52,211,153,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>You save {Math.round(savedRatio * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ HOW TO GET IT — Stepper ══ */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
              How to Get It
            </p>
            <div style={{ position: "relative" }}>
              {/* Connector line */}
              <div style={{
                position: "absolute", left: 14, top: 28, bottom: 28, width: 1,
                background: `linear-gradient(to bottom, ${colorA}40, ${colorB}20, transparent)`,
              }} />
              {[
                { n: 1, title: "Visit the student plan page", sub: `Go to ${discount.service_name}'s student signup page` },
                { n: 2, title: `${verify.label}`, sub: "Complete the student verification process" },
                { n: 3, title: "Activate and start saving!", sub: `$${monthly}/month saved immediately` },
              ].map(({ n, title, sub }, idx) => (
                <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: idx < 2 ? 20 : 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800,
                    background: `linear-gradient(135deg, ${colorA}40, ${colorB}25)`,
                    border: `1px solid ${colorA}50`,
                    color: colorA === "#7C3AED" ? "#C084FC" : colorA,
                    boxShadow: `0 0 12px ${colorA}20`,
                    zIndex: 1, position: "relative",
                  }}>
                    {n}
                  </div>
                  <div style={{ paddingTop: 4, flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>{title}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.4 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ REQUIREMENTS ══ */}
          {requirements.length > 0 && (
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
                Requirements
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100,
                  background: `${colorA}10`, border: `1px solid ${colorA}20`,
                }}>
                  <ShieldCheck style={{ width: 13, height: 13, color: colorA === "#7C3AED" ? "#A78BFA" : colorA, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.60)" }}>{verify.label}</span>
                </div>
                {requirements.map((req, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ NOTES ══ */}
          {discount.notes && (
            <div style={{
              margin: "0 24px 16px",
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 12,
              background: `${colorA}08`,
              border: `1px solid ${colorA}18`,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <Sparkles style={{ width: 13, height: 13, color: colorA === "#7C3AED" ? "#A78BFA" : colorA, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.70)" }}>Note: </span>
                {discount.notes}
              </p>
            </div>
          )}

          {/* ══ APPLIED STATE ══ */}
          {isApplied && (
            <div style={{
              margin: "0 24px 16px",
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <CheckCircle2 style={{ width: 15, height: 15, color: "#34D399", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6EE7B7" }}>Discount already applied ✓</span>
            </div>
          )}
        </div>

        {/* ══ ACTION FOOTER ══ */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.25)",
          display: "flex", gap: 10, flexShrink: 0,
        }}>
          {/* Primary CTA */}
          <a
            href={discount.direct_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 20px", borderRadius: 14, fontWeight: 700, fontSize: 14,
              color: "white", textDecoration: "none",
              background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
              boxShadow: `0 4px 20px ${colorA}40`,
              transition: "all 0.22s cubic-bezier(0.23,1,0.32,1)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${colorA}55`; (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${colorA}40`; (e.currentTarget as HTMLElement).style.filter = ""; }}
          >
            Get Student Discount
            <ExternalLink style={{ width: 14, height: 14 }} />
          </a>

          {/* Secondary: Mark as Applied */}
          {discount.subscription_id && !isApplied && (
            <button
              onClick={handleApply}
              disabled={applying}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "13px 18px", borderRadius: 14, fontWeight: 600, fontSize: 13,
                flexShrink: 0, cursor: applying ? "not-allowed" : "pointer",
                background: "rgba(16,185,129,0.10)",
                border: "1px solid rgba(16,185,129,0.28)",
                color: "#34D399",
                transition: "all 0.2s",
                opacity: applying ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!applying) { e.currentTarget.style.background = "rgba(16,185,129,0.20)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.10)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.28)"; e.currentTarget.style.transform = ""; }}
            >
              {applying
                ? <div style={{ width: 14, height: 14, border: "2px solid #34D399", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : <CheckCircle2 style={{ width: 14, height: 14 }} />
              }
              {applying ? "Applying…" : "Mark Applied"}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
