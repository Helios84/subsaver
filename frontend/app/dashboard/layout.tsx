import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage all your subscriptions, track spending, and discover student discounts in one place.",
  robots: { index: false, follow: false }, // Private page — don't index
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
