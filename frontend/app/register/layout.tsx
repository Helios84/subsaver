import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join SubSaver for free. Track subscriptions, find student discounts, and save hundreds of dollars per year.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
