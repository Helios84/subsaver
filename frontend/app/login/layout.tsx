import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to SubSaver to see your subscriptions, renewals and spending.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
