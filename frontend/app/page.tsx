"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  DollarSign, BarChart3, Shield, Zap, Bell,
  GraduationCap, CheckCircle2, Sparkles,
  Users, TrendingDown, Star
} from "lucide-react";
import { apiFetch } from "./lib/api";

/* ── Animated Counter ── */
function AnimatedCounter({ target, prefix = "", suffix = "", duration = 1800 }: {
  target: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(target * ease));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Centre wrapper — inline styles to bypass any Tailwind/CSS issues ── */
const CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: "1024px",
  width: "100%",
  margin: "0 auto",
  paddingLeft: "32px",
  paddingRight: "32px",
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
      className="liquid-card rounded-2xl p-8 group cursor-default flex flex-col items-center text-center gap-4"
      style={{ animationDelay: delay }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-2xl transition-transform duration-300 group-hover:scale-110"
        style={{
          width: "52px", height: "52px",
          minWidth: "52px", minHeight: "52px",
          background: `${color}15`,
          border: `1px solid ${color}35`,
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
          <div className="py-4 relative flex items-center justify-between w-full">
            {/* LEFT: Logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5 shadow-lg">
                    <Image src="/logo.png" alt="SubSaver Logo" width={28} height={28} className="w-7 h-7 rounded-lg" />
                  </div>
                </div>
                <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                  Sub<span className="gradient-text">Saver</span>
                </span>
              </Link>
            </div>

            {/* CENTER: Navigation (Absolutely positioned for perfect centering regardless of side widths) */}
            <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-8">
              {["Features", "Pricing", "Students"].map(item => (
                <span key={item} className="text-sm text-white/50 hover:text-white transition-colors cursor-pointer font-medium">
                  {item}
                </span>
              ))}
            </nav>

            {/* RIGHT: Actions */}
            <div className="flex-1 flex items-center justify-end gap-3 lg:gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {user && (
                    <div className="hidden lg:flex flex-col items-end mr-2">
                      <span className="text-xs text-white/40 font-medium tracking-wide uppercase">Logged in as</span>
                      <span className="text-sm text-white/80 font-semibold">{user.email}</span>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="hidden md:flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Log out
                  </button>
                  <Link href="/dashboard" className="hero-btn-primary text-sm font-bold px-4 md:px-5 py-2.5 flex items-center justify-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Dashboard</span>
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="group relative text-sm font-bold px-4 md:px-5 py-2.5 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Log in</span>
                  </Link>
                  <Link href="/register" className="hero-btn-primary text-sm font-bold px-4 md:px-5 py-2.5 flex items-center justify-center">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
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
          <FloatingCard name="Netflix" price="$3.99/mo" icon="🎬" color="#E50914" delay="1.2s" x="5%" y="62%" rotate="3deg" />
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
            padding: "144px 32px",
          }}
        >
          <div className="liquid-badge animate-pulse-glow mb-8">
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
            <span>The #1 Finance App for Students</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-syne, sans-serif)",
              fontSize: "clamp(52px, 9vw, 100px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.93,
              marginBottom: "32px",
              maxWidth: "900px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "white" }}>Stack Your</span>
            <br />
            <span className="gradient-text-animate">Savings.</span>
          </h1>

          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.7, marginBottom: "48px", textAlign: "center" }}>
            The intelligent subscription manager built for campus life.
            Find student discounts, split costs, and stop wasting money.
          </p>

          <div className="flex gap-4 justify-center items-center flex-wrap mb-8">
            {isAuthenticated ? (
              <Link href="/dashboard" className="hero-btn-primary text-base font-bold px-9 py-4 flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="hero-btn-primary text-base font-bold px-9 py-4 flex items-center gap-2.5">
                  <Zap className="w-5 h-5" style={{ fill: "currentColor" }} />
                  Start Saving Free
                </Link>
                <Link href="/dashboard" className="hero-btn-ghost text-base font-semibold px-9 py-4 flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5" />
                  View Demo
                </Link>
              </>
            )}
          </div>

          <div className="flex justify-center gap-8 text-sm text-white/30 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500/60" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500/60" />
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

      {/* ─── STATS ─── */}
      <section style={{ width: "100%", padding: "80px 0" }}>
        <div style={CONTAINER_STYLE}>
          {/*
            2×2 on mobile/tablet  →  4×1 on ≥1024 px
          */}
          <div className="liquid-panel rounded-3xl w-full grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
            {[
              { value: 10000, suffix: "+", label: "Students Enrolled", color: "#7C3AED", icon: "🎓" },
              { value: 847, prefix: "$", suffix: "/yr", label: "Avg Savings Per Student", color: "#D946EF", icon: "💰" },
              { value: 98, suffix: "%", label: "Satisfaction Rate", color: "#06B6D4", icon: "⭐" },
              { value: 200, suffix: "+", label: "Services Supported", color: "#10B981", icon: "🔗" },
            ].map((s, i) => {
              // Map correct borders based on index
              let borderClasses = "";
              if (i === 0) borderClasses = "border-b border-r border-white/10 lg:border-b-0";
              else if (i === 1) borderClasses = "border-b border-white/10 lg:border-b-0 lg:border-r";
              else if (i === 2) borderClasses = "border-r border-white/10";
              else borderClasses = "border-none";

              return (
                <div
                  key={i}
                  className={`group relative flex flex-col items-center justify-center text-center ${borderClasses} transition-colors duration-300 min-w-0`}
                  style={{
                    padding: "clamp(16px, 2.5vw, 32px) clamp(12px, 1.5vw, 20px)",
                  }}
                >
                  {/* Coloured top-edge accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0, left: "20%", right: "20%",
                      height: "2px",
                      borderRadius: "0 0 4px 4px",
                      background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
                      opacity: 0.6,
                    }}
                  />

                  {/* Emoji icon */}
                  <div
                    className="text-2xl mb-3 transition-transform duration-300 group-hover:scale-110"
                    style={{ filter: "saturate(1.2)" }}
                  >
                    {s.icon}
                  </div>

                  {/* Animated number */}
                  <p
                    className="font-black mb-1.5 leading-none tracking-tight"
                    style={{
                      color: s.color,
                      fontSize: "clamp(22px, 2.5vw, 32px)",
                    }}
                  >
                    <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </p>

                  {/* Label */}
                  <p
                    style={{
                      fontSize: "clamp(9px, 1vw, 11px)",
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="section-divider" />

      {/* ─── FEATURES ─── */}
      <section style={{ width: "100%", padding: "112px 0" }}>
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
            <FeatureCard icon={DollarSign} title="Student Discounts" desc="Unlock exclusive student pricing for Spotify, Adobe, and more — verified instantly through your .edu email." color="#7C3AED" delay="0s" />
            <FeatureCard icon={Bell} title="Renewal Reminders" desc="Get notified before free trials end or yearly plans renew. Never be surprised by unexpected charges again." color="#06B6D4" delay="0.1s" />
            <FeatureCard icon={BarChart3} title="Expense Tracking" desc="Visualize exactly where your money goes. Track both monthly and yearly subscriptions in one place." color="#10B981" delay="0.2s" />
            <FeatureCard icon={Users} title="Split Costs" desc="Share Netflix with a roommate? Split the cost in the app and track exactly what your share is." color="#D946EF" delay="0.3s" />
            <FeatureCard icon={Shield} title="Secure & Private" desc="Your financial data is encrypted and private. We never sell your personal information — ever." color="#F59E0B" delay="0.4s" />
            <FeatureCard icon={TrendingDown} title="Save Smarter" desc="AI-powered insights identify subscriptions you're not using and suggest where you can cut costs." color="#EF4444" delay="0.5s" />
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="section-divider" />

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ width: "100%", padding: "112px 0" }}>
        <div style={CONTAINER_STYLE}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "64px", width: "100%" }}>
            <h2
              className="text-4xl lg:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              Loved by <span className="gradient-text">Students</span>
            </h2>
            <p className="text-white/40 text-base">Join thousands already saving every month</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ width: "100%" }}>
            {[
              { name: "Alex K.", school: "MIT", text: "I was paying full price for Adobe and Spotify. SubSaver found me $47/month in discounts instantly. Game changer.", stars: 5 },
              { name: "Sarah M.", school: "Stanford", text: "The split cost feature alone saved me $30/month sharing Netflix and Spotify with my roommates. Love this app.", stars: 5 },
              { name: "James T.", school: "NYU", text: "Finally an app that understands student budgets. Renewal reminders have saved me from so many surprise charges.", stars: 5 },
            ].map((t, i) => (
              <div key={i} className="liquid-card rounded-2xl p-7 flex flex-col gap-5">
                <div className="flex gap-0.5">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/65 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
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
                    fontSize: "clamp(28px, 5vw, 52px)",
                  }}
                >
                  Ready to Stack<br />Your Savings?
                </h2>

                {/* Sub */}
                <p
                  className="text-white/60 leading-relaxed mb-8"
                  style={{ fontSize: "clamp(14px, 1.5vw, 16px)", maxWidth: "340px" }}
                >
                  Join thousands of students taking control of their finances — for free.
                </p>

                {/* Feature list */}
                <div className="flex flex-col gap-3 w-full max-w-xs lg:max-w-none">
                  {[
                    "Automatic student discount finder",
                    "Renewal alerts before you're charged",
                    "Split costs with roommates in one tap",
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
                    Start saving today
                  </p>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Free account · 2 minutes · No credit card needed.
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
                      $847
                    </p>
                    <div>
                      <p className="text-xs text-white font-semibold">avg saved / year</p>
                      <p className="text-xs text-white/40">per student</p>
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
                <Image src="/logo.png" alt="SubSaver" width={20} height={20} className="w-5 h-5 rounded" />
              </div>
              <span className="font-bold text-white" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                Sub<span className="text-white/40">Saver</span>
              </span>
            </div>
            <p className="text-sm text-white/25">© 2026 SubSaver. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-white/35">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-white cursor-pointer transition-colors">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
