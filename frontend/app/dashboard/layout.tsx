import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your subscriptions, monthly spend, upcoming renewals and student prices in one place.",
  robots: { index: false, follow: false }, // Private page — don't index
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
