"use client";

import { useState, useEffect } from "react";
import { X, GraduationCap, CreditCard, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const ONBOARDING_KEY = "subsaver_onboarding_done";

const STEPS = [
  {
    id: "welcome",
    icon: "🎓",
    iconColor: "#A78BFA",
    title: "Welcome to SubSaver!",
    subtitle: "Subscription tracker for students",
    description:
      "Track all your subscriptions in one place, look up student prices, and get renewal reminders before you're charged.",
    cta: "Get Started",
    skip: null,
  },
  {
    id: "verify",
    icon: GraduationCap,
    iconColor: "#34D399",
    title: "Unlock Student Discounts",
    subtitle: "A catalog of student prices",
    description:
      "Verify your .edu email, then check the catalog for student pricing on Spotify, Adobe, Microsoft 365 and other services.",
    cta: "Verify Student Status",
    ctaLink: "/settings?tab=student",
    skip: "Skip for now",
  },
  {
    id: "subscription",
    icon: CreditCard,
    iconColor: "#60A5FA",
    title: "Add Your First Subscription",
    subtitle: "Start tracking today",
    description:
      "Add the apps and services you're already paying for. SubSaver tracks renewal dates and reminds you before you're billed.",
    cta: "Close & Add Subscription",
    skip: "Maybe later",
  },
];

interface Props {
  onClose: () => void;
  onAddSubscription?: () => void;
}

export default function OnboardingModal({ onClose, onAddSubscription }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const current = STEPS[step];

  useEffect(() => {
    setTimeout(() => setVisible(true), 30);
  }, []);

  function dismiss() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
    setTimeout(onClose, 300);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
      onAddSubscription?.();
    }
  }

  function skip() {
    if (step === STEPS.length - 1) {
      dismiss();
    } else {
      setStep(s => s + 1);
    }
  }

  const isIcon = typeof current.icon !== "string";
  const IconComponent = isIcon ? (current.icon as React.ElementType) : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: `rgba(0,0,0,${visible ? 0.65 : 0})`,
        backdropFilter: visible ? "blur(8px)" : "none",
        transition: "background 0.3s, backdrop-filter 0.3s",
      }}
      onClick={e => e.target === e.currentTarget && dismiss()}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: "linear-gradient(160deg, #0D0B1E 0%, #0a0d1a 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          padding: "40px 36px 32px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1), opacity 0.35s ease",
          overflow: "hidden",
        }}
      >
        {/* Aurora glow */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Close */}
        <button
          onClick={dismiss}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", transition: "all 0.2s", zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          <X size={15} />
        </button>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 4, borderRadius: 100,
                flex: i === step ? 2 : 1,
                background: i <= step
                  ? "linear-gradient(90deg, #7C3AED, #D946EF)"
                  : "rgba(255,255,255,0.1)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, marginBottom: 24,
          background: `${current.iconColor}14`,
          border: `1px solid ${current.iconColor}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {IconComponent
            ? <IconComponent size={32} color={current.iconColor} />
            : <span style={{ fontSize: 32 }}>{current.icon as string}</span>
          }
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
          borderRadius: 100, marginBottom: 14,
          background: `${current.iconColor}14`,
          border: `1px solid ${current.iconColor}28`,
        }}>
          <CheckCircle2 size={11} color={current.iconColor} />
          <span style={{ fontSize: 11, fontWeight: 700, color: current.iconColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {current.subtitle}
          </span>
        </div>

        {/* Text */}
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 12, lineHeight: 1.3, fontFamily: "var(--font-syne, sans-serif)" }}>
          {current.title}
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, marginBottom: 32 }}>
          {current.description}
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {current.ctaLink ? (
            <Link
              href={current.ctaLink}
              onClick={dismiss}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 20px", borderRadius: 14,
                background: "linear-gradient(135deg, #7C3AED, #D946EF)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.4)"; }}
            >
              {current.cta} <ChevronRight size={16} />
            </Link>
          ) : (
            <button
              onClick={next}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 20px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #7C3AED, #D946EF)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.4)"; }}
            >
              {current.cta} <ChevronRight size={16} />
            </button>
          )}

          {current.skip && (
            <button
              onClick={skip}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", fontSize: 13, cursor: "pointer", padding: "8px 0", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
            >
              {current.skip}
            </button>
          )}
        </div>

        {/* Step indicator */}
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 20 }}>
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}

/** Call this before rendering to check if onboarding should show */
export function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(ONBOARDING_KEY);
}
