"use client";

import Link from "next/link";
import Image from "next/image";
import { Layers, DollarSign, BarChart3, Shield, Zap, Bell, GraduationCap, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-white selection:bg-violet-500/30">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-panel border-b border-white/5">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1 shadow-lg shadow-violet-500/20">
              <Image src="/logo.png" alt="SubSaver Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sub<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Saver</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-white text-violet-950 text-sm font-bold rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-32 lg:py-48 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div style={{ margin: '0 auto' }} className="relative max-w-4xl space-y-8 text-center">
          <div className="flex justify-center">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium text-violet-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-fuchsia-400" />
              The #1 Finance App for Students
            </div>
          </div>

          <h1 className="text-5xl lg:text-8xl font-black tracking-tight text-white leading-[1.1]">
            Stack Your Savings.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
              Own Your Future.
            </span>
          </h1>

          <p style={{ margin: '0 auto' }} className="text-xl lg:text-2xl text-gray-400 font-light max-w-2xl leading-relaxed">
            The intelligent subscription manager built for campus life. Find student discounts, split costs with roommates, and stop wasting money.
          </p>

          <div className="flex gap-4 justify-center items-center flex-wrap pt-8">
            <Link
              href="/register"
              className="px-8 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-bold rounded-2xl hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(124,58,237,0.4)] flex items-center gap-2"
            >
              <Zap className="w-5 h-5 fill-current" />
              Start Saving Free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-5 bg-white/5 border border-white/10 text-white text-lg font-semibold rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <BarChart3 className="w-5 h-5" />
              View Demo
            </Link>
          </div>

          <div className="flex justify-center gap-8 pt-8 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Free for students
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ marginTop: '80px' }} className="mx-auto max-w-[1600px] px-6 lg:px-10 py-32 relative">
        <div className="text-center mb-24">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Everything You Need to <span className="text-fuchsia-400">Save Money</span>
          </h2>
          <p style={{ margin: '0 auto' }} className="text-lg text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to help you understand and optimize your subscription spending.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 text-violet-400">
              <DollarSign className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Student Discounts</h3>
            <p className="text-gray-400 leading-relaxed">
              Unlock exclusive student pricing (Spotify, Adobe, etc.) directly in the app. We verify your status instantly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 text-blue-400">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Renewal Reminders</h3>
            <p className="text-gray-400 leading-relaxed">
              Get notified before free trials end or yearly plans renew. Never get surprised by unexpected charges again.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 text-green-400">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Expense Tracking</h3>
            <p className="text-gray-400 leading-relaxed">
              Track both monthly and yearly subscriptions. Visualize exactly where your money goes each month.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 text-purple-400">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Secure & Private</h3>
            <p className="text-gray-400 leading-relaxed">
              Your financial data is encrypted and secure. We are privacy-first and never sell your personal information.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 text-orange-400">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
            <p className="text-gray-400 leading-relaxed">
              Built with modern technology for instant updates and smooth interactions. Works perfectly on any device.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-violet-500/30 transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 text-pink-400">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Split Costs</h3>
            <p className="text-gray-400 leading-relaxed">
              Share Netflix with a roommate? Split the cost in the app and track exactly what *your* share is.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ marginTop: '128px' }} className="mx-auto max-w-[1600px] px-6 lg:px-10 py-40">
        <div className="rounded-[40px] p-12 lg:p-24 text-center bg-gradient-to-br from-violet-600 to-fuchsia-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <h2 className="relative text-3xl lg:text-6xl font-black text-white mb-8 leading-tight">
            Ready to Stack Your Savings?
          </h2>
          <p style={{ margin: '0 auto' }} className="relative text-xl text-violet-100 mb-10 max-w-2xl leading-relaxed">
            Join thousands of students who are taking control of their finances with SubSaver.
          </p>
          <Link
            href="/register"
            className="relative inline-flex items-center gap-2 px-10 py-5 bg-white text-violet-900 text-xl font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
          >
            <Zap className="w-6 h-6 fill-current" />
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg p-1.5 shadow-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Sub<span className="text-white/60">Saver</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 SubSaver. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
