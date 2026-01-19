"use client";

import Link from "next/link";
import { TrendingUp, DollarSign, BarChart3, Shield, Zap, Bell } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-panel border-b-0">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 rounded-lg p-1.5 shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Sub<span className="text-red-600">Saver</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-[1600px] px-6 lg:px-10 py-32 lg:py-48">
        <div style={{ margin: '0 auto' }} className="max-w-4xl space-y-8 text-center">
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-semibold">
              💰 Save Money on Subscriptions
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
            Take Full Control of Your{" "}
            <span className="text-red-600">Subscriptions</span>
          </h1>

          <p style={{ margin: '0 auto' }} className="text-xl lg:text-2xl text-gray-600 font-light max-w-2xl leading-relaxed">
            Track, manage, and optimize all your recurring payments in one beautiful dashboard.
            Never miss a renewal again.
          </p>

          <div className="flex gap-4 justify-center items-center flex-wrap pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-xl shadow-red-600/30 flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Free Today
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 glass-card text-gray-700 text-lg font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              View Demo
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required • Free forever • 2 minutes setup
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ marginTop: '80px' }} className="mx-auto max-w-[1600px] px-6 lg:px-10 py-32 bg-gradient-to-b from-transparent to-gray-50/50">
        <div className="text-center mb-20">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Save Money
          </h2>
          <p style={{ margin: '0 auto' }} className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you understand and optimize your subscription spending
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Visualize your spending with beautiful charts. See monthly costs, yearly projections, and top expenses at a glance.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Renewal Reminders</h3>
            <p className="text-gray-600 leading-relaxed">
              Get notified before subscriptions renew. Never get surprised by unexpected charges again.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Expense Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Track both monthly and yearly subscriptions. See exactly where your money goes each month.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
            <p className="text-gray-600 leading-relaxed">
              Your data is encrypted and secure. We never share your information with third parties.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-600 leading-relaxed">
              Built with modern technology for instant updates and smooth interactions. No lag, no waiting.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Save More Money</h3>
            <p className="text-gray-600 leading-relaxed">
              Users save an average of $500/year by identifying and canceling unused subscriptions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ marginTop: '128px' }} className="mx-auto max-w-[1600px] px-6 lg:px-10 py-40">
        <div className="rounded-3xl p-12 lg:p-20 text-center bg-gradient-to-br from-red-600 to-red-700 shadow-2xl">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8">
            Ready to Save Money?
          </h2>
          <p style={{ margin: '0 auto' }} className="text-xl text-white/95 mb-10 max-w-2xl leading-relaxed">
            Join thousands of users who are taking control of their subscription spending
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 text-lg font-bold rounded-xl hover:bg-gray-50 hover:shadow-2xl active:scale-[0.98] transition-all shadow-xl"
          >
            <Zap className="w-5 h-5" />
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50/50">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 rounded-lg p-1 shadow-sm">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Sub<span className="text-red-600">Saver</span>
              </span>
            </div>
            <p className="text-sm text-gray-600">
              © 2026 SubSaver. Take control of your subscriptions.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
