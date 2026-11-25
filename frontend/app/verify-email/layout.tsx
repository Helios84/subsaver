import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm Email",
  description: "Enter the 6-digit code from your inbox to confirm your SubSaver account.",
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
