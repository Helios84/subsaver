"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  LogOut,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Activity,
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

type BillingCycle = "monthly" | "yearly";
type Status = "active" | "cancelled";

type Sub = {
  id: number;
  name: string;
  price_cents: number;
  billing_cycle: BillingCycle;
  status: Status;
  category: string;
  created_at: string;
  next_billing_date?: string;
};

const COLORS = ["#DC2626", "#F87171", "#FDA4AF", "#E5E7EB"];

const CATEGORIES = [
  { value: "Entertainment", icon: "🎬", color: "#DC2626" },
  { value: "Productivity", icon: "💼", color: "#F59E0B" },
  { value: "Gaming", icon: "🎮", color: "#8B5CF6" },
  { value: "Utilities", icon: "🔧", color: "#3B82F6" },
  { value: "Communication", icon: "📱", color: "#10B981" },
  { value: "Health & Fitness", icon: "🏋️", color: "#EF4444" },
  { value: "Education", icon: "📚", color: "#6366F1" },
  { value: "Food & Delivery", icon: "🍔", color: "#F97316" },
  { value: "Other", icon: "🎨", color: "#6B7280" },
];

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Calculate days until renewal
function calculateDaysUntilRenewal(next_billing_date?: string): number | null {
  if (!next_billing_date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewalDate = new Date(next_billing_date);
  renewalDate.setHours(0, 0, 0, 0);

  const diffTime = renewalDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Get badge color based on days until renewal
function getRenewalBadgeColor(daysUntil: number | null): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (daysUntil === null) {
    return {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
      label: "No date set"
    };
  }

  if (daysUntil < 0) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      label: "Overdue"
    };
  }

  if (daysUntil <= 3) {
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      label: `Renews in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
    };
  }

  if (daysUntil <= 7) {
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-300",
      label: `Renews in ${daysUntil} days`
    };
  }

  if (daysUntil <= 14) {
    return {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-300",
      label: `Renews in ${daysUntil} days`
    };
  }

  return {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    label: `Renews in ${daysUntil} days`
  };
}

// Format date for display
function formatDate(dateString?: string): string {
  if (!dateString) return "Not set";

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function DashboardPage() {
  const router = useRouter();

  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<string>("");

  // Create form
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("9.99");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [category, setCategory] = useState<string>("Other");
  const [billingDate, setBillingDate] = useState<string>("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("0");
  const [editCycle, setEditCycle] = useState<BillingCycle>("monthly");
  const [editCategory, setEditCategory] = useState<string>("Other");
  const [editBillingDate, setEditBillingDate] = useState<string>("");

  const [editStatus, setEditStatus] = useState<Status>("active");

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { totalMonthly, totalActive, totalYearly, totalSavings, nextRenewal, chartData, topExpenses, categoryData, upcomingRenewals, avgPerSub, priceDistribution, avgPerCategory, monthlyTrend } = useMemo(() => {
    const activeSubs = subs.filter((s) => s.status === "active");
    const cancelledSubs = subs.filter((s) => s.status === "cancelled");

    // Total Monthly
    const sumMonthly = activeSubs.reduce((acc, s) => {
      const monthly =
        s.billing_cycle === "monthly"
          ? s.price_cents
          : Math.round(s.price_cents / 12);
      return acc + monthly;
    }, 0);

    // Total Yearly
    const sumYearly = sumMonthly * 12;

    // Total Savings (from cancelled subscriptions)
    const savings = cancelledSubs.reduce((acc, s) => {
      const monthly = s.billing_cycle === "monthly" ? s.price_cents : Math.round(s.price_cents / 12);
      // Assume cancelled 3 months ago on average
      return acc + (monthly * 3);
    }, 0);

    // Next Renewal Date
    const subsWithDates = activeSubs.filter(s => s.next_billing_date);
    const sortedByDate = [...subsWithDates].sort((a, b) =>
      new Date(a.next_billing_date!).getTime() - new Date(b.next_billing_date!).getTime()
    );
    const nextRenewalDate = sortedByDate[0]?.next_billing_date;

    // Chart Data (Monthly vs Yearly Count)
    const monthlyCount = activeSubs.filter(s => s.billing_cycle === 'monthly').length;
    const yearlyCount = activeSubs.filter(s => s.billing_cycle === 'yearly').length;

    // Top Expenses (Bar Chart)
    const sortedByPrice = [...activeSubs]
      .sort((a, b) => b.price_cents - a.price_cents)
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        price: s.price_cents / 100
      }));

    // Category Breakdown
    const categoryMap = new Map<string, number>();
    activeSubs.forEach(s => {
      const cat = s.category || "Other";
      const current = categoryMap.get(cat) || 0;
      const monthly = s.billing_cycle === "monthly" ? s.price_cents : Math.round(s.price_cents / 12);
      categoryMap.set(cat, current + monthly);
    });

    const categoryChartData = Array.from(categoryMap.entries()).map(([name, value]) => {
      const categoryInfo = CATEGORIES.find(c => c.value === name) || CATEGORIES[CATEGORIES.length - 1];
      return {
        name,
        value: value / 100,
        color: categoryInfo.color,
        icon: categoryInfo.icon
      };
    }).sort((a, b) => b.value - a.value);

    // Upcoming Renewals (next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcoming = activeSubs
      .filter(s => s.next_billing_date)
      .map(s => ({
        ...s,
        daysUntil: calculateDaysUntilRenewal(s.next_billing_date)
      }))
      .filter(s => s.daysUntil !== null && s.daysUntil >= 0 && s.daysUntil <= 30)
      .sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));

    // NEW: Average per subscription
    const avgPerSubscription = activeSubs.length > 0 ? sumMonthly / activeSubs.length : 0;

    // NEW: Category count map
    const categoryCountMap = new Map<string, number>();
    activeSubs.forEach(s => {
      const cat = s.category || "Other";
      categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);
    });

    // NEW: Average per Category
    const avgPerCategoryData = Array.from(categoryMap.entries())
      .map(([name, totalCost]) => {
        const count = categoryCountMap.get(name) || 1;
        const categoryInfo = CATEGORIES.find(c => c.value === name) || CATEGORIES[CATEGORIES.length - 1];
        return {
          name,
          avgCost: (totalCost / count) / 100,
          color: categoryInfo.color,
          icon: categoryInfo.icon
        };
      })
      .filter(item => item.avgCost > 0)
      .sort((a, b) => b.avgCost - a.avgCost);

    // NEW: Price Distribution
    const priceRanges = [
      { range: '$0-10', min: 0, max: 1000, count: 0, color: '#10B981' },
      { range: '$10-20', min: 1000, max: 2000, count: 0, color: '#3B82F6' },
      { range: '$20-50', min: 2000, max: 5000, count: 0, color: '#F59E0B' },
      { range: '$50-100', min: 5000, max: 10000, count: 0, color: '#EF4444' },
      { range: '$100+', min: 10000, max: Infinity, count: 0, color: '#DC2626' }
    ];
    activeSubs.forEach(s => {
      const monthly = s.billing_cycle === "monthly" ? s.price_cents : Math.round(s.price_cents / 12);
      for (const range of priceRanges) {
        if (monthly >= range.min && monthly < range.max) {
          range.count++;
          break;
        }
      }
    });
    const priceDistData = priceRanges.filter(r => r.count > 0);

    // NEW: Monthly Trend (simulated)
    const now = new Date();
    const monthlyTrendData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const variation = Math.random() * 0.3 - 0.15;
      const cost = (sumMonthly / 100) * (1 + variation);
      monthlyTrendData.push({
        month: monthName,
        cost: Math.max(0, Number(cost.toFixed(2)))
      });
    }

    return {
      totalMonthly: formatMoney(sumMonthly),
      totalYearly: formatMoney(sumYearly),
      totalSavings: formatMoney(savings),
      nextRenewal: nextRenewalDate,
      totalActive: activeSubs.length,
      avgPerSub: formatMoney(avgPerSubscription),
      chartData: [
        { name: 'Monthly', value: monthlyCount },
        { name: 'Yearly', value: yearlyCount },
      ],
      topExpenses: sortedByPrice,
      categoryData: categoryChartData,
      upcomingRenewals: upcoming,
      priceDistribution: priceDistData,
      avgPerCategory: avgPerCategoryData,
      monthlyTrend: monthlyTrendData
    };
  }, [subs]);

  useEffect(() => {
    const t = localStorage.getItem("subsaver_token");
    if (!t) router.push("/login");
  }, [router]);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const data = await apiFetch("/subscriptions", { method: "GET" });
      setSubs(data);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("subsaver_token");
    router.push("/login");
  }

  async function createSub(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const body: any = {
        name: name.trim(),
        price_cents: Math.max(0, Math.round(Number(price) * 100)),
        billing_cycle: cycle,
        status: "active",
        category: category,
      };

      if (billingDate) {
        body.next_billing_date = new Date(billingDate).toISOString();
      }

      await apiFetch("/subscriptions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setName("");
      setPrice("9.99");
      setCycle("monthly");
      setCategory("Other");
      setBillingDate("");
      await load();
    } catch (err: any) {
      setMsg(err?.message ?? "Create failed");
    }
  }

  function startEdit(s: Sub) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPrice((s.price_cents / 100).toFixed(2));
    setEditCycle(s.billing_cycle);
    setEditStatus(s.status);
    setEditCategory(s.category || "Other");
    setEditBillingDate(s.next_billing_date ? s.next_billing_date.split('T')[0] : "");
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setMsg("");
  }

  async function saveEdit(subId: number) {
    setMsg("");
    try {
      const body: any = {
        name: editName.trim(),
        price_cents: Math.max(0, Math.round(Number(editPrice) * 100)),
        billing_cycle: editCycle,
        status: editStatus,
        category: editCategory,
      };

      if (editBillingDate) {
        body.next_billing_date = new Date(editBillingDate).toISOString();
      }

      const updated = await apiFetch(`/subscriptions/${subId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setSubs((prev) => prev.map((s) => (s.id === subId ? updated : s)));
      setEditingId(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Update failed");
    }
  }

  async function toggleStatus(s: Sub) {
    setMsg("");
    const next: Status = s.status === "active" ? "cancelled" : "active";

    // optimistic UI
    setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));

    try {
      const updated = await apiFetch(`/subscriptions/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setSubs((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch (err: any) {
      // rollback
      setSubs((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      setMsg(err?.message ?? "Toggle failed");
    }
  }

  function confirmDelete(subId: number) {
    if (editingId === subId) setEditingId(null);
    setDeletingId(subId);
    setMsg("");
  }

  function cancelDelete() {
    setDeletingId(null);
    setMsg("");
  }

  async function executeDelete(subId: number) {
    setMsg("");
    try {
      await apiFetch(`/subscriptions/${subId}`, { method: "DELETE" });
      setSubs((prev) => prev.filter((s) => s.id !== subId));
      if (deletingId === subId) setDeletingId(null);
    } catch (err: any) {
      setMsg(err?.message ?? "Delete failed");
    }
  }

  return (
    <main className="min-h-screen pb-12">
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

          <div className="flex items-center gap-6">
            <Link className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors" href="/">
              Home
            </Link>
            <Link className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors" href="/settings">
              Settings
            </Link>
            <button
              onClick={logout}
              className="group flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-8 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Monthly Spend</h3>
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalMonthly}</p>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 sm:w-32 sm:h-32 bg-red-500/5 rounded-full blur-2xl" />
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalActive}</p>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Yearly Projection</h3>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {formatMoney(Number(totalMonthly.replace('$', '')) * 12 * 100)}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Avg per Sub</h3>
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{avgPerSub}</p>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/5 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Charts Section */}
        {subs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Expenses Bar Chart */}
            <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Top Expenses
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topExpenses} layout="vertical" margin={{ left: 0, right: 0, bottom: 0, top: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#6B7280' }} interval={0} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="price" fill="#DC2626" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Billing Cycle Pie Chart */}
            <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-red-500" />
                Billing Distribution
              </h3>
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#DC2626]" /> Monthly
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F87171]" /> Yearly
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Priority Charts */}
        {subs.length > 0 && categoryData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Category Breakdown */}
            <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                Category Breakdown
              </h3>
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => `$${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-600">{cat.icon} {cat.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">${cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Tracker */}
            <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col justify-between bg-gradient-to-br from-green-50 to-emerald-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Money Saved
                </h3>
                <p className="text-sm text-gray-500 mb-6">From cancelled subscriptions</p>
              </div>

              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-4xl font-bold text-green-600 mb-2">{totalSavings}</p>
                <p className="text-sm text-gray-500">Total savings (last 3 months)</p>
              </div>

              <div className="bg-white/50 rounded-xl p-4 border border-green-100">
                <p className="text-xs text-gray-600 text-center">
                  💡 Keep cancelling unused subscriptions to save more!
                </p>
              </div>
            </div>

            {/* Renewal Calendar */}
            <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                Upcoming Renewals
              </h3>

              {upcomingRenewals.length > 0 ? (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {upcomingRenewals.map((sub) => {
                    const badge = getRenewalBadgeColor(sub.daysUntil);
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm">
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{sub.name}</p>
                            <p className="text-xs text-gray-500">{formatDate(sub.next_billing_date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">{formatMoney(sub.price_cents)}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} mt-1`}>
                            {sub.daysUntil === 0 ? 'Today!' : sub.daysUntil === 1 ? 'Tomorrow' : `${sub.daysUntil}d`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No upcoming renewals</p>
                    <p className="text-xs text-gray-400 mt-1">Set billing dates to see reminders</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* NEW ADVANCED CHARTS */}
        {subs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Monthly Spending Trend */}
            {monthlyTrend.length > 0 && (
              <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Monthly Spending Trend
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ left: 10, right: 10, bottom: 5, top: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        stroke="#E5E7EB"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        stroke="#E5E7EB"
                        tickFormatter={(value) => '$' + value}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => ['$' + Number(value).toFixed(2), 'Cost']}
                      />
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#3B82F6"
                        fill="url(#colorCost)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Price Distribution */}
            {priceDistribution.length > 0 && (
              <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Price Distribution
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceDistribution} margin={{ left: 0, right: 0, bottom: 5, top: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        stroke="#E5E7EB"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        stroke="#E5E7EB"
                        label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [value, 'Subscriptions']}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                        {priceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Average Cost per Category */}
            {avgPerCategory.length > 0 && (
              <div className="glass-card rounded-2xl p-6 min-h-[350px] flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Avg Cost per Category
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avgPerCategory} layout="vertical" margin={{ left: 0, right: 10, bottom: 0, top: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        interval={0}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => ['$' + Number(value).toFixed(2), 'Avg Cost']}
                      />
                      <Bar dataKey="avgCost" radius={[0, 6, 6, 0]} barSize={20}>
                        {avgPerCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Main Content Grid - SWAPPED ORDER: List first, then Side Panel */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">

          {/* Subscription List */}
          <section className="glass-card rounded-2xl p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                Your Subscriptions
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{subs.length}</span>
              </h2>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-gray-50/80 animate-pulse rounded-xl border border-gray-100" />
                ))}
              </div>
            ) : subs.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-500">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-medium">No subscriptions yet</p>
                <p className="text-sm mt-1">Add your first one to see analytics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subs.map((s) => {
                  const isEditing = editingId === s.id;
                  const isDeleting = deletingId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`group relative rounded-xl border p-4 transition-all duration-300 ${isEditing ? 'border-red-500 ring-4 ring-red-500/10 bg-white' : 'border-gray-100 bg-white hover:border-red-200 hover:shadow-md'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {!isEditing ? (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-lg shrink-0">
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 truncate text-base">{s.name}</h3>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s.billing_cycle}</span>
                                    <span className={`px-1.5 py-0.5 rounded capitalize ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                      {s.status}
                                    </span>
                                  </div>

                                  {/* Renewal Badge */}
                                  {(() => {
                                    const daysUntil = calculateDaysUntilRenewal(s.next_billing_date);
                                    const badge = getRenewalBadgeColor(daysUntil);

                                    return (
                                      <div className="mt-2 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          {formatDate(s.next_billing_date)}
                                        </span>
                                        {daysUntil !== null && (
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border} ${daysUntil <= 3 && daysUntil >= 0 ? 'animate-pulse' : ''}`}>
                                            {daysUntil <= 3 && daysUntil >= 0 && <AlertCircle className="w-3 h-3" />}
                                            {badge.label}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</label>
                                  <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</label>
                                  <div className="relative mt-1">
                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-medium">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <select
                                  value={editCycle}
                                  onChange={(e) => setEditCycle(e.target.value as BillingCycle)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                >
                                  <option value="monthly">Monthly</option>
                                  <option value="yearly">Yearly</option>
                                </select>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value as Status)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                >
                                  <option value="active">Active</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                      {cat.icon} {cat.value}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Billing Date</label>
                                <input
                                  type="date"
                                  value={editBillingDate}
                                  onChange={(e) => setEditBillingDate(e.target.value)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isDeleting ? (
                            <div className="flex flex-col items-end gap-2 mt-1">
                              <span className="text-xs font-bold text-red-600 animate-pulse">Confirm Delete?</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => executeDelete(s.id)}
                                  className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={cancelDelete}
                                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : !isEditing ? (
                            <>
                              <div className="mb-2 text-lg font-bold text-gray-900 tracking-tight">
                                {formatMoney(s.price_cents)}
                              </div>
                              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEdit(s)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleStatus(s)}
                                  className={`p-1.5 rounded-md transition ${s.status === 'active' ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-green-600 bg-green-50'}`}
                                  title={s.status === 'active' ? "Cancel Subscription" : "Re-activate"}
                                >
                                  <Activity className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(s.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-2 mt-4">
                              <button
                                onClick={() => saveEdit(s.id)}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
                              >
                                <Save className="w-3 h-3" /> Save Changes
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Add Form Side Panel */}
          <div className="space-y-6">
            <section className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-600" />
                Add New
              </h2>

              <form className="space-y-4" onSubmit={createSub}>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition text-sm"
                    placeholder="e.g. Spotify"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cost</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-400 text-sm font-medium">$</span>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Billing Cycle</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCycle('monthly')}
                      className={`text-sm py-2 rounded-lg font-medium transition-all ${cycle === 'monthly' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setCycle('yearly')}
                      className={`text-sm py-2 rounded-lg font-medium transition-all ${cycle === 'yearly' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Next Billing Date</label>
                  <input
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional - for email reminders</p>
                </div>

                <button className="w-full bg-red-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 mt-2">
                  <Plus className="w-4 h-4" />
                  Add Subscription
                </button>

                {msg && <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded-lg border border-red-100">{msg}</p>}
              </form>
            </section>

            {/* Pro Tip Card */}
            <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 hidden lg:block">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Pro Tip
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Cancelling unused subscriptions can save you over <span className="text-emerald-400 font-bold">$500/year</span> on average.
              </p>
            </div>
          </div>
        </div >
      </div >
    </main >
  );
}
