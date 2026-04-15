import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "SubSaver | Smart Savings for Students",
    template: "%s | SubSaver",
  },
  description: "The intelligent subscription manager built for campus life. Find student discounts, split costs with roommates, and stop wasting money on subscriptions.",
  keywords: ["student discounts", "subscription manager", "save money student", "student deals", "subscription tracker"],
  authors: [{ name: "SubSaver" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://subsaver.example",
    siteName: "SubSaver",
    title: "SubSaver | Smart Savings for Students",
    description: "Track subscriptions, find student discounts, and save up to $847/year. Built for campus life.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SubSaver | Smart Savings for Students",
    description: "Track subscriptions, find student discounts, and save up to $847/year.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
