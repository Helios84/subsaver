import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a free SubSaver account to track subscriptions, renewals and student prices.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
