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
  title: "SubSaver | Smart Savings for Students",
  description: "The intelligent subscription manager built for campus life. Find student discounts, split costs with roommates, and stop wasting money.",
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
