import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customize Dashboard",
  description: "Choose which widgets appear on your SubSaver dashboard, their order and their size.",
  robots: { index: false, follow: false }, // Private page — don't index
};

export default function CustomizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
