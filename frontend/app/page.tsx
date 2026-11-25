"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BarChart3, Bell, CalendarClock, GraduationCap, LayoutDashboard,
  ListPlus, Menu, PieChart, Shield, SlidersHorizontal, Users, X, ArrowRight,
} from "lucide-react";
import DemoLoginButton from "./components/DemoLoginButton";

// Optional contact address; the footer link is hidden when it is not set.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";

const HEADING_FONT = { fontFamily: "var(--font-syne, sans-serif)" } as const;

const STEPS = [
  {
    icon: ListPlus,
    title: "Add what you pay for",
    text: "Pick a service from the list or type your own. Enter the price, the billing cycle and how many people share it.",
    image: "/screenshots/step-add.webp",
    alt: "The service picker with a search box and a list of services",
  },
  {
    icon: PieChart,
    title: "See where the money goes",
    text: "The dashboard adds everything up: your monthly total, a six-month trend and a breakdown by category.",
    image: "/screenshots/step-dashboard.webp",
    alt: "Dashboard charts: spending trend and category breakdown",
  },
  {
    icon: CalendarClock,
    title: "Know what renews next",
    text: "Upcoming charges are listed by date and shown on a calendar. Turn on email reminders to hear about them a few days ahead.",
    image: "/screenshots/step-renewals.webp",
    alt: "The list of upcoming renewals and the billing calendar",
  },
];

const FEATURES = [
  { icon: Users, color: "#D946EF", title: "Cost splitting", text: "Share a plan with roommates? Record how many people split it and see only your share in the totals." },
  { icon: GraduationCap, color: "#A78BFA", title: "Student prices", text: "A catalog of 60 services with student pricing, matched against your subscriptions by name." },
  { icon: Bell, color: "#22D3EE", title: "Renewal reminders", text: "An optional email a few days before a subscription renews. You choose how many days." },
  { icon: BarChart3, color: "#34D399", title: "Spending charts", text: "Monthly and yearly totals, a six-month trend and a category breakdown, in USD, EUR or GBP." },
  { icon: SlidersHorizontal, color: "#FBBF24", title: "Adjustable dashboard", text: "Reorder, resize or hide dashboard widgets with drag and drop. Your layout is saved to your account." },
  { icon: Shield, color: "#F87171", title: "Private by design", text: "You enter everything by hand. No bank connection, no ads, no analytics. Passwords are stored as bcrypt hashes." },
];

function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/logo.svg" alt="" width={size} height={size} className="rounded-md" />
      <span className="text-lg font-extrabold tracking-tight text-white" style={HEADING_FONT}>
        Sub<span className="gradient-text">Saver</span>
      </span>
    </span>
  );
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("subsaver_token"));
  }, []);

  const logout = () => {
    localStorage.removeItem("subsaver_token");
    setIsAuthenticated(false);
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
  ];

  return (
    <main className="min-h-screen w-full overflow-x-clip text-white" style={{ background: "#080B14" }}>

      {/* ─── Header ─── */}
      <header className="glass-header sticky top-0 z-50 w-full">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="SubSaver home" className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            {isAuthenticated ? (
              <>
                <button onClick={logout} className="hero-btn-ghost h-10 px-4 text-sm font-semibold">Log out</button>
                <Link href="/dashboard" className="hero-btn-primary h-10 gap-2 px-5 text-sm font-bold">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hero-btn-ghost h-10 px-4 text-sm font-semibold">Log in</Link>
                <Link href="/register" className="hero-btn-primary h-10 px-5 text-sm font-bold">Create account</Link>
              </>
            )}
          </div>

          <button
            id="mobile-menu-btn"
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-5 pb-5 pt-3 md:hidden" style={{ background: "rgba(8,11,20,0.97)" }}>
            <nav aria-label="Mobile" className="flex flex-col">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-3 text-base font-medium text-white/80">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="hero-btn-primary h-12 text-sm font-bold">Go to dashboard</Link>
                  <button onClick={logout} className="hero-btn-ghost h-12 text-sm font-semibold">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/register" className="hero-btn-primary h-12 text-sm font-bold">Create account</Link>
                  <Link href="/login" className="hero-btn-ghost h-12 text-sm font-semibold">Log in</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative w-full overflow-hidden">
        <div className="aurora-container" aria-hidden="true">
          <div className="aurora-blob animate-aurora-1" style={{ width: 640, height: 640, top: "-18%", left: "-12%", background: "radial-gradient(circle, rgba(124,58,237,0.32) 0%, transparent 70%)" }} />
          <div className="aurora-blob animate-aurora-2" style={{ width: 560, height: 560, top: "8%", right: "-14%", background: "radial-gradient(circle, rgba(217,70,239,0.22) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
          <div className="liquid-badge mb-7">
            <GraduationCap className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
            <span>Free subscription tracker for students</span>
          </div>

          <h1
            className="mb-6 max-w-4xl font-black text-white"
            style={{ ...HEADING_FONT, fontSize: "clamp(28px, 5vw, 58px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Know what your <br className="hidden sm:block" />
            <span className="gradient-text">subscriptions</span> cost
          </h1>

          <p className="mb-9 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Add the subscriptions you pay for and see the monthly total, your share of split plans,
            and what renews next. You enter everything by hand; nothing connects to your bank.
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            {isAuthenticated ? (
              <Link href="/dashboard" className="hero-btn-primary h-[52px] w-full gap-2.5 px-9 text-[15px] font-bold sm:w-auto">
                <LayoutDashboard className="h-[18px] w-[18px]" /> Go to dashboard
              </Link>
            ) : (
              <>
                {DEMO_ENABLED && (
                  <div className="w-full sm:w-auto">
                    <DemoLoginButton className="hero-btn-primary h-[52px] w-full gap-2.5 px-9 text-[15px] font-bold sm:w-auto" />
                  </div>
                )}
                <Link
                  href="/register"
                  className={`${DEMO_ENABLED ? "hero-btn-ghost font-semibold" : "hero-btn-primary font-bold"} h-[52px] w-full gap-2.5 px-8 text-[15px] sm:w-auto`}
                >
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {!isAuthenticated && DEMO_ENABLED && (
            <p className="mt-4 text-sm text-white/60">
              The demo opens a temporary account with sample data. No sign-up needed.
            </p>
          )}

          {/* Product screenshot */}
          <div className="mt-14 w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl" style={{ boxShadow: "0 40px 120px -30px rgba(124,58,237,0.45)" }}>
            <Image
              src="/screenshots/dashboard.webp"
              alt="The SubSaver dashboard with sample data: monthly spend, spending trend, category breakdown and upcoming renewals"
              width={1440}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 960px"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="w-full scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-black text-white sm:text-4xl" style={HEADING_FONT}>How it works</h2>
            <p className="text-base text-white/70">Three steps, a few minutes. All screenshots show the demo account.</p>
          </div>

          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="liquid-card flex flex-col overflow-hidden rounded-2xl">
                <div className="border-b border-white/10 bg-black/20">
                  <Image src={s.image} alt={s.alt} width={800} height={600} sizes="(max-width: 768px) 100vw, 320px" className="block h-auto w-full" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300">
                    <s.icon className="h-4 w-4" aria-hidden="true" /> Step {i + 1}
                  </p>
                  <h3 className="text-lg font-bold text-white" style={HEADING_FONT}>{s.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="section-divider" />

      {/* ─── Features ─── */}
      <section id="features" className="w-full scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-black text-white sm:text-4xl" style={HEADING_FONT}>What it does</h2>
            <p className="text-base text-white/70">The features that exist today, nothing planned or promised.</p>
          </div>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="liquid-card flex flex-col gap-4 rounded-2xl p-6">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}1F`, border: `1px solid ${f.color}55` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="mb-1.5 text-base font-bold text-white" style={HEADING_FONT}>{f.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-white/60">
            SubSaver is a student portfolio project. It does not cancel, pay for or manage subscriptions with any provider,
            and catalog prices are maintained by hand, so check the provider&apos;s site before relying on them.
          </p>
        </div>
      </section>

      {/* ─── Call to action ─── */}
      <section className="w-full px-5 pb-20 sm:px-8">
        <div
          className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16"
          style={{ background: "linear-gradient(135deg, #3B1F7E 0%, #5B21B6 45%, #86198F 100%)" }}
        >
          <h2 className="max-w-xl text-2xl font-black text-white sm:text-4xl" style={{ ...HEADING_FONT, textWrap: "balance" }}>
            See it with sample data first
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-white/80">
            {DEMO_ENABLED
              ? "Open the demo to look around, or create a free account to track your own subscriptions."
              : "Create a free account to track your own subscriptions."}
          </p>
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            {isAuthenticated ? (
              <Link href="/dashboard" className="cta-btn-white flex h-[52px] w-full items-center justify-center gap-2 px-8 text-[15px] font-black sm:w-auto">
                <LayoutDashboard className="h-4 w-4" /> Go to dashboard
              </Link>
            ) : (
              <>
                {DEMO_ENABLED && (
                  <div className="w-full sm:w-auto">
                    <DemoLoginButton className="cta-btn-white flex h-[52px] w-full items-center justify-center gap-2 px-8 text-[15px] font-black sm:w-auto" />
                  </div>
                )}
                <Link
                  href="/register"
                  className={`${DEMO_ENABLED ? "border border-white/40 text-white hover:bg-white/10" : "cta-btn-white font-black"} flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] px-8 text-[15px] font-semibold transition-colors sm:w-auto`}
                >
                  Create free account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="w-full border-t border-white/10">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-5 px-5 py-9 sm:px-8 md:flex-row">
          <Logo size={20} />
          <p className="text-sm text-white/60">© {new Date().getFullYear()} SubSaver. A student portfolio project.</p>
          <nav aria-label="Footer" className="flex gap-6 text-sm text-white/70">
            <Link href="/privacy" className="py-2 hover:text-white">Privacy</Link>
            <Link href="/terms" className="py-2 hover:text-white">Terms</Link>
            {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`} className="py-2 hover:text-white">Contact</a>}
          </nav>
        </div>
      </footer>
    </main>
  );
}
