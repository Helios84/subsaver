"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DollarSign, BarChart3, Shield, Zap, Bell,
  GraduationCap, CheckCircle2, Sparkles,
  Users, TrendingDown, ArrowRight
} from "lucide-react";
import { apiFetch } from "./lib/api";

// Optional contact address; the footer link is hidden when it is not set.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

/* ── Centre wrapper — inline styles to bypass any Tailwind/CSS issues ── */
const CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: "1024px",
  width: "100%",
  margin: "0 auto",
  paddingLeft: "clamp(20px, 5vw, 32px)",
  paddingRight: "clamp(20px, 5vw, 32px)",
  boxSizing: "border-box",
};

/* ── Floating Subscription Card ── */
function FloatingCard({ name, price, icon, color, delay, x, y, rotate }: {
  name: string; price: string; icon: string; color: string;
  delay: string; x: string; y: string; rotate: string;
}) {
  return (
    <div
      className="absolute liquid-card rounded-2xl px-4 py-3 flex items-center gap-3 select-none"
      style={{
        left: x, top: y,
        animation: `liquid-float 7s ease-in-out infinite ${delay}`,
        transform: `rotate(${rotate})`,
        minWidth: "170px",
        zIndex: 2,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${color}25`, border: `1px solid ${color}40` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/50 font-medium">{name}</p>
        <p className="text-sm font-bold text-white">{price}</p>
      </div>
    </div>
  );
}

/* ── Feature Card — centred icon, centred text ── */
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: any; title: string; desc: string; color: string; delay: string;
}) {
  return (
    <div
      className="liquid-card rounded-2xl p-8 group cursor-default flex flex-col items-center text-center gap-4 transition-all duration-300 hover:translate-y-[-4px]"
      style={{
        animationDelay: delay,
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
        style={{
          width: "56px", height: "56px",
          minWidth: "56px", minHeight: "56px",
          background: `${color}18`,
          border: `1px solid ${color}38`,
          boxShadow: `0 0 0 0 ${color}30`,
        }}
      >
        <Icon style={{ width: "24px", height: "24px", color, flexShrink: 0 }} />
      </div>
      <div>
        <h3
          className="text-base font-bold text-white mb-2"
          style={{ fontFamily: "var(--font-syne, sans-serif)" }}
        >
          {title}
        </h3>
        <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("subsaver_token");
      if (token) {
        setIsAuthenticated(true);
        apiFetch("/users/me")
          .then(data => setUser(data))
          .catch(err => console.error("Failed to load user info:", err));
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("subsaver_token");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#080B14", color: "white", display: "block", width: "100%" }}>

      {/* ─── HEADER ─── */}
      <header className="glass-header sticky top-0 z-50" style={{ width: "100%" }}>
        <div style={CONTAINER_STYLE}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
            position: "relative",
          }}>

            {/* LEFT: Logo */}
            <Link href="/" className="group" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #7C3AED, #D946EF)", borderRadius: "10px", filter: "blur(8px)", opacity: 0.5 }} className="group-hover:opacity-80 transition-opacity" />
                <div style={{ position: "relative", background: "linear-gradient(135deg, #7C3AED, #D946EF)", borderRadius: "10px", padding: "6px", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>
                  <Image src="/logo.svg" alt="SubSaver" width={24} height={24} style={{ width: 24, height: 24, borderRadius: "6px", display: "block" }} />
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-syne, sans-serif)", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.01em", color: "white" }}>
                Sub<span className="gradient-text">Saver</span>
              </span>
            </Link>

            {/* CENTER: Nav — desktop only */}
            <nav style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }} className="hidden lg:flex">
              {[
                { label: "Features", href: "#features" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                    cursor: "pointer",
                    paddingBottom: "2px",
                    borderBottom: "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "white";
                    (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "rgba(167,139,250,0.6)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
                    (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "transparent";
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* RIGHT: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              {isAuthenticated ? (
                <>
                  {user && (
                    <span className="hidden lg:block" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginRight: "4px" }}>
                      {user.email}
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex"
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      height: "38px",
                      padding: "0 18px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.6)",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  >
                    Log out
                  </button>
                  <Link
                    href="/dashboard"
                    className="hero-btn-primary"
                    style={{ height: "38px", padding: "0 18px", fontSize: "13px", fontWeight: 700, gap: "6px" }}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  {/* Log in — ghost button, visible border */}
                  <Link
                    href="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "38px",
                      padding: "0 18px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.80)",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.80)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  >
                    Log in
                  </Link>

                  {/* Get Started — primary */}
                  <Link
                    href="/register"
                    className="hero-btn-primary"
                    style={{ height: "38px", padding: "0 18px", fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap" }}
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(o => !o)}
                className="flex lg:hidden"
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: "38px",
                  height: "38px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  flexDirection: "column",
                  gap: "5px",
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <>
                    <span style={{ display: "block", width: "16px", height: "1.5px", background: "white", borderRadius: "2px", transform: "rotate(45deg) translateY(4.5px)" }} />
                    <span style={{ display: "block", width: "16px", height: "1.5px", background: "white", borderRadius: "2px", transform: "rotate(-45deg) translateY(-4.5px)" }} />
                  </>
                ) : (
                  <>
                    <span style={{ display: "block", width: "16px", height: "1.5px", background: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                    <span style={{ display: "block", width: "12px", height: "1.5px", background: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                    <span style={{ display: "block", width: "16px", height: "1.5px", background: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div style={{
            background: "rgba(8,11,20,0.97)",
            backdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "20px",
          }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
              {[
                { label: "Features", href: "#features" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                    borderRadius: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                >
                  {label}
                </a>
              ))}
            </nav>
            {!isAuthenticated && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "46px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "15px", fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hero-btn-primary"
                  style={{ height: "46px", fontSize: "15px", fontWeight: 700 }}
                >
                  Get Started Free
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="hero-btn-primary"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "46px", fontSize: "15px", fontWeight: 700, textDecoration: "none" }}
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section
        style={{ position: "relative", minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
      >
        {/* Aurora blobs */}
        <div className="aurora-container">
          <div className="aurora-blob animate-aurora-1 animate-aurora-pulse" style={{ width: "700px", height: "700px", background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(124,58,237,0.05) 70%)", top: "5%", left: "-10%" }} />
          <div className="aurora-blob animate-aurora-2" style={{ width: "600px", height: "600px", background: "radial-gradient(circle, rgba(217,70,239,0.3) 0%, rgba(217,70,239,0.04) 70%)", top: "20%", right: "-5%" }} />
          <div className="aurora-blob animate-aurora-3" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)", bottom: "10%", left: "30%" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {/* Floating subscription cards */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <FloatingCard name="Spotify" price="$4.99/mo" icon="🎵" color="#1DB954" delay="0s" x="4%" y="28%" rotate="-4deg" />
          <FloatingCard name="Adobe CC" price="$19.99/mo" icon="🎨" color="#FF0000" delay="0.5s" x="76%" y="24%" rotate="5deg" />
          <FloatingCard name="Xbox Pass" price="$4.99/mo" icon="🎮" color="#107C10" delay="1.8s" x="72%" y="62%" rotate="-3deg" />
          <FloatingCard name="Notion" price="Free" icon="📝" color="#FFFFFF" delay="0.8s" x="3%" y="46%" rotate="2deg" />
        </div>

        {/* Hero content — absolute centre */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "clamp(80px, 13vh, 144px) clamp(20px, 5vw, 32px)",
          }}
        >
          {/* Badge */}
          <div className="liquid-badge animate-pulse-glow" style={{ marginBottom: "28px" }}>
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
            <span>Subscription tracker for students</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-syne, sans-serif)",
              fontSize: "clamp(52px, 9vw, 100px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.93,
              marginBottom: "36px",
              maxWidth: "900px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "white" }}>Track your</span>
            <br />
            <span className="gradient-text-animate">subscriptions.</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "17px",
              color: "rgba(255,255,255,0.5)",
              maxWidth: "500px",
              lineHeight: 1.7,
              marginBottom: "44px",
              textAlign: "center",
            }}
          >
            See what your subscriptions cost each month, split shared plans,
            get renewal reminders and look up student prices.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="hero-btn-primary"
                style={{
                  gap: "10px",
                  padding: "0 36px",
                  fontSize: "15px",
                  fontWeight: 700,
                  height: "52px",
                  letterSpacing: "0.01em",
                }}
              >
                <BarChart3 style={{ width: 18, height: 18, flexShrink: 0 }} />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="hero-btn-primary"
                  style={{
                    gap: "10px",
                    padding: "0 36px",
                    fontSize: "15px",
                    fontWeight: 700,
                    height: "52px",
                    letterSpacing: "0.01em",
                  }}
                >
                  <Zap style={{ width: 18, height: 18, flexShrink: 0, fill: "currentColor" }} />
                  Start Saving Free
                </Link>

                <Link
                  href="/login"
                  className="hero-btn-ghost"
                  style={{
                    gap: "10px",
                    padding: "0 36px",
                    fontSize: "15px",
                    fontWeight: 600,
                    height: "52px",
                    letterSpacing: "0.01em",
                  }}
                >
                  Log In
                  <ArrowRight style={{ width: 16, height: 16, flexShrink: 0 }} />
                </Link>
              </>
            )}
          </div>

          {/* Trust row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.32)", fontWeight: 500 }}>
              <CheckCircle2 style={{ width: 15, height: 15, color: "rgba(74,222,128,0.6)", flexShrink: 0 }} />
              No credit card required
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.32)", fontWeight: 500 }}>
              <CheckCircle2 style={{ width: 15, height: 15, color: "rgba(74,222,128,0.6)", flexShrink: 0 }} />
              Free for students
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.25 }}>
          <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white rounded-full" style={{ animation: "liquid-float 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="section-divider" />

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ width: "100%", padding: "80px 0" }}>
        <div style={CONTAINER_STYLE}>
          {/* Centred heading */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "64px", width: "100%" }}>
            <div className="liquid-badge mb-6">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Powerful Features</span>
            </div>
            <h2
              className="text-4xl lg:text-5xl font-black text-white mb-5 leading-tight"
              style={{ fontFamily: "var(--font-syne, sans-serif)", maxWidth: "600px" }}
            >
              Everything You Need to <span className="gradient-text">Save Money</span>
            </h2>
            <p className="text-base text-white/40" style={{ maxWidth: "480px" }}>
              Tools designed to help you understand and optimize your subscription spending.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ width: "100%" }}>
            <FeatureCard icon={DollarSign} title="Student Discounts" desc="Look up student prices for 60 services such as Spotify and Adobe, and see which of your subscriptions have one." color="#7C3AED" delay="0s" />
            <FeatureCard icon={Bell} title="Renewal Reminders" desc="Get an email a few days before a subscription renews, so a charge never comes as a surprise." color="#06B6D4" delay="0.1s" />
            <FeatureCard icon={BarChart3} title="Expense Tracking" desc="Visualize exactly where your money goes. Track both monthly and yearly subscriptions in one place." color="#10B981" delay="0.2s" />
            <FeatureCard icon={Users} title="Split Costs" desc="Share Netflix with a roommate? Split the cost in the app and track exactly what your share is." color="#D946EF" delay="0.3s" />
            <FeatureCard icon={Shield} title="Secure & Private" desc="Passwords are stored as bcrypt hashes and all traffic uses HTTPS. No ads, no analytics, no bank connection." color="#F59E0B" delay="0.4s" />
            <FeatureCard icon={TrendingDown} title="Spending Insights" desc="Simple rule-based tips: renewals due this week, categories that dominate your budget, and plans that may be cheaper yearly." color="#EF4444" delay="0.5s" />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ width: "100%", padding: "80px 0 100px" }}>
        <div style={CONTAINER_STYLE}>
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "clamp(20px, 3vw, 28px)",
              background: "linear-gradient(135deg, #3B1F7E 0%, #6B21A8 30%, #9D174D 65%, #7C3AED 100%)",
            }}
          >
            {/* Ambient blobs — decorative only */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="aurora-blob animate-aurora-2" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)", top: "-30%", right: "-5%" }} />
              <div className="aurora-blob animate-aurora-3" style={{ width: "350px", height: "350px", background: "radial-gradient(circle, rgba(0,0,0,0.22) 0%, transparent 70%)", bottom: "-20%", left: "5%" }} />
            </div>

            {/*
              Layout:
                • Mobile  (< lg): flex-col, text centred
                • Desktop (≥ lg): 2-column grid, text left / card right
            */}
            <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-2 lg:items-center">

              {/* ── LEFT: headline + feature list ── */}
              <div
                className="flex flex-col items-center text-center lg:items-start lg:text-left"
                style={{ padding: "clamp(36px, 6vw, 64px)" }}
              >
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-lg mb-6"
                  style={{
                    padding: "6px 14px",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" style={{ fill: "currentColor" }} />
                  <span className="text-sm text-white font-medium">Free Forever for Students</span>
                </div>

                {/* Headline */}
                <h2
                  className="font-black text-white mb-4 leading-[1.08]"
                  style={{
                    fontFamily: "var(--font-syne, sans-serif)",
                    fontSize: "clamp(28px, 4vw, 48px)",
                  }}
                >
                  Track your<br />subscriptions.
                </h2>

                {/* Sub */}
                <p
                  className="text-white/60 leading-relaxed mb-8"
                  style={{ fontSize: "clamp(14px, 1.5vw, 16px)", maxWidth: "340px" }}
                >
                  Free to use. You enter your subscriptions by hand; nothing connects to your bank.
                </p>

                {/* Feature list */}
                <div className="flex flex-col gap-3 w-full max-w-xs lg:max-w-none">
                  {[
                    "Student prices for 60 services",
                    "Email reminders before a renewal",
                    "Shared plans split between roommates",
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="shrink-0 rounded-full flex items-center justify-center"
                        style={{ width: "20px", height: "20px", minWidth: "20px", background: "rgba(255,255,255,0.15)" }}
                      >
                        <CheckCircle2 style={{ width: "12px", height: "12px", color: "white" }} />
                      </div>
                      <span className="text-sm text-white/70">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: glass action card ── */}
              <div
                className="flex items-center justify-center"
                style={{ padding: "clamp(24px, 5vw, 64px)" }}
              >
                <div
                  className="flex flex-col gap-4 w-full"
                  style={{
                    maxWidth: "360px",
                    borderRadius: "20px",
                    padding: "clamp(24px, 4vw, 36px)",
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                  }}
                >
                  <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                    Get started
                  </p>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Free account. No credit card needed.
                  </p>

                  {/* Stat pill */}
                  <div
                    className="flex items-center gap-3"
                    style={{
                      borderRadius: "12px",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <p
                      className="font-black text-fuchsia-300 font-mono tabular-nums"
                      style={{ fontSize: "28px", lineHeight: 1 }}
                    >
                      60
                    </p>
                    <div>
                      <p className="text-xs text-white font-semibold">services</p>
                      <p className="text-xs text-white/40">in the student discount catalog</p>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  {isAuthenticated ? (
                    <Link
                      href="/dashboard"
                      className="cta-btn-white font-black flex items-center justify-center gap-2"
                      style={{ padding: "14px 24px", fontSize: "15px", width: "100%" }}
                    >
                      <BarChart3 className="w-4 h-4" style={{ fill: "currentColor" }} />
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="cta-btn-white font-black flex items-center justify-center gap-2"
                        style={{ padding: "14px 24px", fontSize: "15px", width: "100%" }}
                      >
                        <Zap className="w-4 h-4" style={{ fill: "currentColor" }} />
                        Create Free Account
                      </Link>

                      {/* Secondary link */}
                      <Link
                        href="/login"
                        className="text-center transition-colors hover:text-white"
                        style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}
                      >
                        Already have an account?{" "}
                        <span className="text-violet-300 font-semibold">Log in →</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={CONTAINER_STYLE}>
          <div className="py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
                <Image src="/logo.svg" alt="SubSaver" width={20} height={20} className="w-5 h-5 rounded" />
              </div>
              <span className="font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                Sub<span className="text-white/40">Saver</span>
              </span>
            </div>
            <p className="text-sm text-white/25">© {new Date().getFullYear()} SubSaver. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-white/35">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              {CONTACT_EMAIL && (
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">Contact</a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
