import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of use for SubSaver, a student portfolio project.",
};

// Optional contact address; the contact line is hidden when it is not set.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function TermsPage() {
  const lastUpdated = "November 12, 2026";

  return (
    <main style={{ minHeight: "100vh", background: "#080B14", color: "white", fontFamily: "var(--font-inter, sans-serif)" }}>
      {/* Nav */}
      <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 800, color: "white", textDecoration: "none", fontFamily: "var(--font-syne, sans-serif)" }}>
          Sub<span style={{ background: "linear-gradient(135deg,#A78BFA,#E879F9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saver</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Back to Dashboard</Link>
      </nav>

      {/* Content */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "60px 40px 100px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", fontSize: 12, color: "#A78BFA", fontWeight: 600, marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, fontFamily: "var(--font-syne, sans-serif)", marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Last updated: {lastUpdated}</p>
        </div>

        <div style={{ marginBottom: 40, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            SubSaver is a student portfolio project, not a commercial service.
          </p>
        </div>

        {[
          {
            title: "1. The Service",
            body: "SubSaver is a subscription tracker for students. You enter your subscriptions by hand; the app shows your spending, upcoming renewals and possible student discounts. It does not cancel, pay for or manage subscriptions with any provider. It is free to use."
          },
          {
            title: "2. Accounts",
            body: "You need a valid email address to create an account. You are responsible for keeping your password private."
          },
          {
            title: "3. Student Discounts",
            body: "Discount information comes from a hand-maintained catalog and may be out of date. Always check the provider's own site before relying on a price. Student verification requires an institutional .edu email address."
          },
          {
            title: "4. Acceptable Use",
            body: "Do not use the Service for anything unlawful, submit false information to obtain student status, or attempt to gain unauthorized access to the Service or other users' data."
          },
          {
            title: "5. No Warranty",
            body: "The Service is provided \"as is\", without warranties of any kind. As a portfolio project it may change, be reset or go offline at any time, so do not rely on it as your only record."
          },
          {
            title: "6. Limitation of Liability",
            body: "To the extent permitted by law, the author is not liable for any damages resulting from your use of, or inability to use, the Service."
          },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "white", fontFamily: "var(--font-syne, sans-serif)" }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>{section.body}</p>
          </section>
        ))}

        <div style={{ marginTop: 48, padding: "24px 28px", borderRadius: 16, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
            Also see our{" "}
            <Link href="/privacy" style={{ color: "#A78BFA", fontWeight: 600 }}>Privacy Policy</Link>
            .
            {CONTACT_EMAIL && (
              <>
                {" "}Questions? Contact{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#A78BFA" }}>{CONTACT_EMAIL}</a>.
              </>
            )}
          </p>
        </div>
      </article>
    </main>
  );
}
