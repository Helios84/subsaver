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
  BadgeCheck,
  GraduationCap,
  Settings,
  Layout,
  Bomb,
  Zap,
  Mail,
  Search, // Added Search icon
} from "lucide-react";
import { getServiceIcon } from "./serviceIcons";
import VerificationModal from "../components/VerificationModal";
import StudentDiscountBanner from "../components/StudentDiscountBanner";
import StudentDiscountModal from "../components/StudentDiscountModal";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import ServicePickerModal from "../components/ServicePickerModal"; // Added ServicePickerModal import
import DashboardEmptyState from "../components/DashboardEmptyState";

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
  student_discount_applied?: boolean;
  split_with?: number;
};

type StudentDiscount = {
  id: number;
  service_name: string;
  category: string;
  regular_price_cents: number;
  student_price_cents: number;
  discount_percentage: number;
  monthly_savings_cents: number;
  annual_savings_cents: number;
  requirements: string;
  verification_method: string;
  direct_link: string;
  availability: string;
  notes: string | null;
  subscription_id?: number;
  already_applied?: boolean;
};

type User = {
  id: number;
  email: string;
  is_verified: boolean;
  edu_email?: string;
};

const COLORS = ["#7C3AED", "#db2777", "#F472B6", "#E5E7EB"]; // Violet, Pink, Light Pink, Gray

const CATEGORIES = [
  { value: "Entertainment", icon: "🎬", color: "#7C3AED" }, // Violet
  { value: "Productivity", icon: "💼", color: "#F59E0B" },
  { value: "Gaming", icon: "🎮", color: "#8B5CF6" },
  { value: "Utilities", icon: "🔧", color: "#3B82F6" },
  { value: "Communication", icon: "📱", color: "#10B981" },
  { value: "Health & Fitness", icon: "🏋️", color: "#db2777" }, // Pink
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
      text: "text-gray-400",
      border: "border-white/10",
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

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Student discount state
  const [studentDiscounts, setStudentDiscounts] = useState<Map<number, StudentDiscount>>(new Map());
  const [selectedDiscount, setSelectedDiscount] = useState<StudentDiscount | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false); // Added ServicePickerModal import

  // Customization State
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [widgets, setWidgets] = useState({
    stats: true,
    spending_trends: true,
    category_breakdown: true,
    insights: true,
    renewals: true,
    savings_card: true
  });

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_widgets");
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse widget preferences", e);
      }
    }
  }, []);

  const toggleWidget = (key: keyof typeof widgets) => {
    const newWidgets = { ...widgets, [key]: !widgets[key] };
    setWidgets(newWidgets);
    localStorage.setItem("dashboard_widgets", JSON.stringify(newWidgets));
  };

  // Autocomplete State
  const [allServices, setAllServices] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all services for autocomplete on mount
  useEffect(() => {
    apiFetch("/api/student-discounts")
      .then(data => {
        if (Array.isArray(data)) {
          setAllServices(data);
        }
      })
      .catch(err => console.error("Failed to fetch autocomplete services", err));
  }, []);

  // Create form
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("9.99");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [category, setCategory] = useState<string>("Other");
  const [billingDate, setBillingDate] = useState<string>("");
  const [splitWith, setSplitWith] = useState<number>(1);
  const [isSplit, setIsSplit] = useState(false);

  useEffect(() => {
    fetchSubs();
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const data = await apiFetch("/users/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  }

  async function addSampleData() {
    const sampleSubs = [
      { name: "Spotify", price_cents: 999, billing_cycle: "monthly", category: "Entertainment", split_with: 2 },
      { name: "Netflix", price_cents: 1599, billing_cycle: "monthly", category: "Entertainment", split_with: 4 },
      { name: "Adobe Creative Cloud", price_cents: 5499, billing_cycle: "monthly", category: "Productivity", split_with: 1 },
      { name: "Xbox Game Pass", price_cents: 999, billing_cycle: "monthly", category: "Gaming", split_with: 1 },
    ];

    try {
      for (const sub of sampleSubs) {
        await apiFetch("/subscriptions", {
          method: "POST",
          body: JSON.stringify(sub),
        });
      }
      await fetchSubs(); // Refresh
    } catch (err) {
      console.error("Failed to add sample data", err);
    }
  }

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("0");
  const [editCycle, setEditCycle] = useState<BillingCycle>("monthly");
  const [editCategory, setEditCategory] = useState<string>("Other");
  const [editBillingDate, setEditBillingDate] = useState<string>("");
  const [editSplitWith, setEditSplitWith] = useState<number>(1);
  const [editIsSplit, setEditIsSplit] = useState(false);

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

  async function fetchSubs() {
    setMsg("");
    setLoading(true);
    try {
      const data = await apiFetch("/subscriptions", { method: "GET" });
      setSubs(data);
      // Load student discounts for all subscriptions
      await loadStudentDiscounts(data);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentDiscounts(subscriptions: Sub[]) {
    try {
      const discountMap = new Map<number, StudentDiscount>();

      // Check each subscription for available discounts
      for (const sub of subscriptions) {
        if (sub.status === "active") {
          try {
            const discount = await apiFetch(`/api/student-discounts/check/${sub.id}`, { method: "GET" });
            if (discount) {
              discountMap.set(sub.id, discount);
            }
          } catch (err) {
            // Discount not found for this subscription, skip
            console.log(`No discount found for ${sub.name}`);
          }
        }
      }

      setStudentDiscounts(discountMap);
    } catch (err) {
      console.error("Failed to load student discounts:", err);
    }
  }

  async function handleApplyDiscount(subscriptionId: number) {
    try {
      await apiFetch(`/api/student-discounts/apply/${subscriptionId}`, { method: "POST" });

      // Update the subscription in state
      setSubs(prev => prev.map(s =>
        s.id === subscriptionId
          ? { ...s, student_discount_applied: true }
          : s
      ));

      // Update the discount in state
      setStudentDiscounts(prev => {
        const newMap = new Map(prev);
        const discount = newMap.get(subscriptionId);
        if (discount) {
          newMap.set(subscriptionId, { ...discount, already_applied: true });
        }
        return newMap;
      });

      setMsg("✅ Student discount marked as applied!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to apply discount");
    }
  }

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
        split_with: isSplit ? splitWith : 1,
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
      setSplitWith(1);
      setIsSplit(false);
      setMsg("✅ Subscription created!");
      fetchSubs();
    } catch (err: any) {
      setMsg(err?.message ?? "Create failed");
    }
  }

  async function handleServiceSelect(service: StudentDiscount) {
    setShowServicePicker(false);

    // Auto-select student price if user is verified, else regular price
    const priceToSet = user?.is_verified ? service.student_price_cents : service.regular_price_cents;

    try {
      const body = {
        name: service.service_name,
        price_cents: priceToSet,
        billing_cycle: "monthly",
        status: "active",
        category: service.category || "Other",
        split_with: 1,
      };

      await apiFetch("/subscriptions", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setMsg(`✅ Added ${service.service_name} to your stack!`);
      // Hide message after 3 seconds
      setTimeout(() => setMsg(""), 3000);

      // Auto-refresh subscriptions list
      fetchSubs();
    } catch (err: any) {
      console.error("Failed to add service", err);
      // Fallback: fill the form if API fails, in case the form is visible
      setName(service.service_name);
      setPrice((priceToSet / 100).toFixed(2));
      setCategory(service.category || "Other");
      setCycle("monthly");

      setMsg(err?.message ?? "Failed to add subscription directly. Please add it manually below.");
      setTimeout(() => {
        document.getElementById('add-new-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
    const split = (s.split_with || 1);
    setEditSplitWith(split);
    setEditIsSplit(split > 1);
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
        split_with: editIsSplit ? editSplitWith : 1,
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

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.length > 1) {
      const filtered = allServices.filter(s =>
        s.service_name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const QuickActions = () => (
    <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
      <button
        onClick={() => setShowServicePicker(true)}
        className="liquid-btn flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold">Add Subscription</span>
      </button>

      <button
        onClick={() => setShowCustomizeModal(true)}
        className="liquid-btn-ghost flex items-center gap-2.5 px-5 py-3 rounded-xl shrink-0"
      >
        <Layout className="w-5 h-5 text-fuchsia-400" />
        <span className="font-medium">Customize</span>
      </button>
    </div>
  );

  return (
    <main className="min-h-screen text-white pb-20 relative overflow-hidden" style={{ background: '#080B14' }}>
      {/* Aurora Background */}
      <div className="aurora-container">
        <div className="aurora-blob animate-aurora-1" style={{ width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', top: '-5%', right: '-5%' }} />
        <div className="aurora-blob animate-aurora-2" style={{ width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(217,70,239,0.09) 0%, transparent 70%)', bottom: '-5%', left: '-5%' }} />
        <div className="aurora-blob animate-aurora-3" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', top: '40%', left: '40%' }} />
      </div>
      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-md opacity-40" />
              <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-1.5">
                <img src="/logo.png" alt="SubSaver" className="w-7 h-7 rounded-lg" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>
              Sub<span className="gradient-text">Saver</span>
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {user && (
              <div className="hidden md:flex items-center">
                {user.is_verified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
                    <BadgeCheck size={14} />
                    <span>Student Verified</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
                  >
                    <GraduationCap size={14} />
                    <span>Verify Student</span>
                  </button>
                )}
              </div>
            )}
            <Link className="text-sm text-white/40 hover:text-white font-medium transition-colors" href="/">
              Home
            </Link>
            <Link className="text-sm text-white/40 hover:text-white font-medium transition-colors" href="/settings">
              Settings
            </Link>
            <button
              onClick={logout}
              className="group flex items-center gap-2 text-sm text-white/40 hover:text-white font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-10 py-8 space-y-6">



        {/* Quick Actions */}
        <QuickActions />

        {/* Customization Modal */}
        {showCustomizeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}>
            <div className="liquid-panel rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                  <Layout className="w-6 h-6 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Customize Dashboard</h3>
                  <p className="text-sm text-gray-400">Choose what you want to see</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'stats', label: 'Key Statistics', icon: Activity },
                  { id: 'spending_trends', label: 'Spending Trends', icon: TrendingUp },
                  { id: 'category_breakdown', label: 'Category Chart', icon: PieChart },
                  { id: 'insights', label: 'Insights Panel', icon: Zap },
                  { id: 'renewals', label: 'Upcoming Renewals', icon: Calendar },
                  { id: 'savings_card', label: 'Savings Card', icon: GraduationCap },
                ].map((item) => (
                  <label key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                      <span className="font-medium text-gray-200">{item.label}</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${widgets[item.id as keyof typeof widgets] ? 'bg-violet-600' : 'bg-gray-700'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={widgets[item.id as keyof typeof widgets]}
                        onChange={() => toggleWidget(item.id as keyof typeof widgets)}
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${widgets[item.id as keyof typeof widgets] ? 'left-7' : 'left-1'}`} />
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Content or Empty State */}
        {!loading && subs.length === 0 ? (
          <DashboardEmptyState
            onAddSampleData={addSampleData}
            onAddSubscription={() => setShowServicePicker(true)}
          />
        ) : (
          <>
            {/* Stats Grid */}
            {!loading && widgets.stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Monthly Spend', value: totalMonthly, icon: DollarSign, color: '#7C3AED', glow: 'rgba(124,58,237,0.2)' },
                  { label: 'Active Subs', value: String(totalActive), icon: Activity, color: '#06B6D4', glow: 'rgba(6,182,212,0.2)' },
                  { label: 'Yearly Projection', value: formatMoney(Number(totalMonthly.replace('$', '')) * 12 * 100), icon: CreditCard, color: '#10B981', glow: 'rgba(16,185,129,0.2)' },
                  { label: 'Avg per Sub', value: avgPerSub, icon: TrendingUp, color: '#D946EF', glow: 'rgba(217,70,239,0.2)' },
                ].map(({ label, value, icon: Icon, color, glow }) => (
                  <div key={label} className="liquid-card rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</span>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>{value}</p>
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: glow }} />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
                  </div>
                ))}
              </div>
            )}

            {/* Advanced Analytics Section */}
            {subs.length > 0 && <AdvancedAnalytics upcomingRenewals={upcomingRenewals} widgets={widgets} />}

            {/* Main Content Grid */}
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

              {/* Subscription List */}
              <section className="liquid-panel rounded-2xl p-6 min-h-[400px]">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                        <CreditCard className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>Your Subscriptions</h2>
                        <p className="text-xs text-white/35">Manage and track your services</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>{subs.length}</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider">Total</div>
                      </div>
                      <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      <div className="text-center">
                        <div className="text-xl font-black text-green-400" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>{totalActive}</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider">Active</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-24 bg-white/5/80 animate-pulse rounded-xl border border-gray-100" />
                    ))}
                  </div>
                ) : subs.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center text-gray-400">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium">No subscriptions yet</p>
                    <p className="text-sm mt-1">Add your first one to see analytics</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subs.map((s) => {
                      const isEditing = editingId === s.id;
                      const isDeleting = deletingId === s.id;
                      const discount = studentDiscounts.get(s.id);
                      const daysUntil = calculateDaysUntilRenewal(s.next_billing_date);
                      const badge = getRenewalBadgeColor(daysUntil);

                      if (isEditing) {
                        // Show full-width editing form
                        return (
                          <div key={s.id} className="md:col-span-2 xl:col-span-3 border border-violet-500/30 bg-white/5 backdrop-blur-sm rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <Edit2 className="w-5 h-5 text-violet-400" />
                              Edit Subscription
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</label>
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</label>
                                <div className="relative mt-1">
                                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-medium">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing Cycle</label>
                                <select
                                  value={editCycle}
                                  onChange={(e) => setEditCycle(e.target.value as BillingCycle)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
                                >
                                  <option value="monthly" style={{ backgroundColor: '#1E293B', color: 'white' }}>Monthly</option>
                                  <option value="yearly" style={{ backgroundColor: '#1E293B', color: 'white' }}>Yearly</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value as Status)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
                                >
                                  <option value="active" style={{ backgroundColor: '#1E293B', color: 'white' }}>Active</option>
                                  <option value="cancelled" style={{ backgroundColor: '#1E293B', color: 'white' }}>Cancelled</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value} style={{ backgroundColor: '#1E293B', color: 'white' }}>
                                      {cat.icon} {cat.value}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Next Billing Date</label>
                                <input
                                  type="date"
                                  value={editBillingDate}
                                  onChange={(e) => setEditBillingDate(e.target.value)}
                                  className="mt-1 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Split Cost?</label>
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="checkbox"
                                    checked={editIsSplit}
                                    onChange={(e) => setEditIsSplit(e.target.checked)}
                                    className="w-4 h-4 text-violet-400 rounded focus:ring-violet-500 border-white/20"
                                  />
                                  <span className="text-sm text-gray-300">Split with others</span>
                                </div>
                                {editIsSplit && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={editSplitWith}
                                    onChange={(e) => setEditSplitWith(parseInt(e.target.value) || 1)}
                                    placeholder="Number of people"
                                    className="mt-2 w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:border-violet-500 outline-none text-sm"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                              <button
                                onClick={() => saveEdit(s.id)}
                                className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-violet-500/40"
                              >
                                <Save className="w-5 h-5" /> Save Changes
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/20 text-gray-300 hover:bg-white/5 hover:border-white/30 transition-all hover:scale-[1.02]"
                              >
                                <X className="w-5 h-5" /> Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Normal card view
                      return (
                        <div
                          key={s.id}
                          className="group relative rounded-xl transition-all duration-300 overflow-hidden liquid-card"
                          style={isDeleting ? { border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)' } : {}}
                        >
                          {/* Student Discount Badge */}
                          {discount && (
                            <div className="absolute top-2 right-2 z-10">
                              {discount.already_applied ? (
                                <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-1.5">
                                  <GraduationCap className="w-3 h-3 text-green-400" />
                                  <span className="text-[10px] font-bold text-green-300">Applied</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedDiscount(discount);
                                    setShowDiscountModal(true);
                                  }}
                                  className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center gap-1.5 hover:bg-violet-500/30 transition-colors"
                                >
                                  <GraduationCap className="w-3 h-3 text-violet-300" />
                                  <span className="text-[10px] font-bold text-violet-200">{discount.discount_percentage}% OFF</span>
                                </button>
                              )}
                            </div>
                          )}

                          <div className="p-5">
                            {/* Icon & Name */}
                            <div className="flex items-start gap-3 mb-4">
                              {(() => {
                                const ServiceIcon = getServiceIcon(s.name);
                                return ServiceIcon ? (
                                  <div className="relative shrink-0">
                                    {/* Glow layer */}
                                    <div className="absolute inset-0 bg-violet-500/40 blur-xl rounded-full" />
                                    {/* Icon container */}
                                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                                      <ServiceIcon className="w-6 h-6 text-violet-300" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative shrink-0">
                                    {/* Glow layer for letter */}
                                    <div className="absolute inset-0 bg-violet-500/30 blur-lg rounded-full" />
                                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xl">
                                      {s.name.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-base truncate">
                                  {s.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'active'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                    }`}>
                                    {s.status}
                                  </span>
                                  <span className="text-xs text-gray-400 capitalize">{s.billing_cycle}</span>
                                </div>
                              </div>
                            </div>

                            {/* Price with Neon Glow */}
                            <div className="mb-4">
                              {s.split_with && s.split_with > 1 ? (
                                <>
                                  <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-green-400/30 blur-lg rounded-lg" />
                                    <div className="relative text-2xl font-bold text-green-400">
                                      {formatMoney(s.price_cents / s.split_with)}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    Split with {s.split_with} • Total: {formatMoney(s.price_cents)}
                                  </div>
                                </>
                              ) : (
                                <div className="relative inline-block">
                                  <div className="absolute inset-0 bg-green-400/30 blur-lg rounded-lg" />
                                  <div className="relative text-2xl font-bold text-green-400">
                                    {formatMoney(s.price_cents)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Renewal Info */}
                            {s.next_billing_date && (
                              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {formatDate(s.next_billing_date)}
                                </span>
                                {daysUntil !== null && (
                                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${daysUntil <= 3 && daysUntil >= 0
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                                    : daysUntil <= 7
                                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`}>
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Delete Confirmation */}
                            {isDeleting && (
                              <div className="flex flex-col gap-3 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <span className="text-sm font-bold text-red-300 text-center">Delete this subscription?</span>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => executeDelete(s.id)}
                                    className="flex-1 px-6 py-3.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all hover:scale-[1.02] shadow-md hover:shadow-lg"
                                  >
                                    Yes, Delete
                                  </button>
                                  <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-6 py-3.5 text-sm font-semibold border-2 border-white/20 text-gray-300 rounded-xl hover:bg-white/5 hover:border-white/30 transition-all hover:scale-[1.02]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {!isDeleting && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEdit(s)}
                                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all hover:scale-[1.02] shadow-sm hover:shadow-lg hover:shadow-violet-500/30"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4.5 h-4.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => toggleStatus(s)}
                                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-sm ${s.status === 'active'
                                    ? 'text-white bg-orange-600 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/30'
                                    : 'text-white bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/30'
                                    }`}
                                  title={s.status === 'active' ? 'Pause' : 'Resume'}
                                >
                                  <Activity className="w-4.5 h-4.5" />
                                  <span>{s.status === 'active' ? 'Pause' : 'Resume'}</span>
                                </button>
                                <button
                                  onClick={() => confirmDelete(s.id)}
                                  className="flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all hover:scale-[1.02] shadow-sm hover:shadow-lg hover:shadow-red-500/30"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
                }
              </section>

              {/* Add Form Side Panel */}
              <div className="space-y-4">
                <section id="add-new-form" className="liquid-panel rounded-2xl p-6 sticky top-24">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.25)' }}>
                      <Plus className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <h2 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-syne, sans-serif)' }}>Add New</h2>
                  </div>

                  <form className="space-y-4" onSubmit={createSub}>
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Service Name</label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <input
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="liquid-input flex-1 px-4 py-3 rounded-xl text-sm"
                            placeholder="e.g. Spotify"
                            required
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={() => setShowServicePicker(true)}
                            className="px-3 py-2 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
                            title="Browse Services"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && (
                          <div className="absolute top-full left-0 w-full mt-1 liquid-panel rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                            {suggestions.map((service) => (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => handleServiceSelect(service)}
                                className="w-full text-left px-4 py-3 flex items-center justify-between transition-all hover:bg-white/5 border-b last:border-0"
                                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                              >
                                <div>
                                  <div className="text-sm font-medium text-white">{service.service_name}</div>
                                  <div className="text-xs text-white/35">{service.category}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-green-400">${(service.student_price_cents / 100).toFixed(2)}</div>
                                  <div className="text-[10px] text-white/25 line-through">${(service.regular_price_cents / 100).toFixed(2)}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Cost</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-white/30 text-sm font-medium z-10">$</span>
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          className="liquid-input w-full py-3 rounded-xl text-sm"
                          style={{ paddingLeft: '2rem', paddingRight: '1rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Billing Cycle</label>
                      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <button
                          type="button"
                          onClick={() => setCycle('monthly')}
                          className="text-sm py-2 rounded-lg font-semibold transition-all"
                          style={cycle === 'monthly' ? { background: 'linear-gradient(135deg, #7C3AED, #D946EF)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setCycle('yearly')}
                          className="text-sm py-2 rounded-lg font-semibold transition-all"
                          style={cycle === 'yearly' ? { background: 'linear-gradient(135deg, #7C3AED, #D946EF)', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="liquid-input w-full px-4 py-3 rounded-xl text-sm"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value} style={{ backgroundColor: '#161B27', color: 'white' }}>
                            {cat.icon} {cat.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Next Billing Date</label>
                      <input
                        value={billingDate}
                        onChange={(e) => setBillingDate(e.target.value)}
                        type="date"
                        className="liquid-input w-full px-4 py-3 rounded-xl text-sm"
                      />
                      <p className="text-[10px] text-white/25 mt-1">Optional — for email reminders</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Split Cost?</label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={isSplit}
                          onChange={(e) => setIsSplit(e.target.checked)}
                          className="w-4 h-4 text-violet-400 rounded focus:ring-red-500 border-white/20"
                        />
                        <span className="text-sm text-gray-300">Yes, I share this subscription</span>
                      </div>

                      {isSplit && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Number of People (including you)</label>
                          <input
                            value={splitWith}
                            onChange={(e) => setSplitWith(parseInt(e.target.value) || 1)}
                            type="number"
                            min="1"
                            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:bg-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <button className="liquid-btn w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 mt-2">
                      <Plus className="w-5 h-5" />
                      Add Subscription
                    </button>

                    {msg && <p className="text-xs text-violet-400 text-center p-2 rounded-lg mt-1" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>{msg}</p>}
                  </form>
                </section>

                {/* Pro Tip Card */}
                <div className="liquid-card rounded-2xl p-5 hidden lg:block" style={{ border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.04)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Pro Tip</h3>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">
                    Cancelling unused subscriptions can save you over <span className="text-emerald-400 font-semibold">$500/year</span> on average.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Student Discount Modal */}
        {showDiscountModal && selectedDiscount && (
          <StudentDiscountModal
            discount={selectedDiscount}
            onApply={handleApplyDiscount}
            onClose={() => {
              setShowDiscountModal(false);
              setSelectedDiscount(null);
            }}
          />
        )}
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => fetchUser()}
        />
        {showServicePicker && (
          <ServicePickerModal
            isVerified={user?.is_verified ?? false}
            onSelect={handleServiceSelect}
            onClose={() => setShowServicePicker(false)}
          />
        )}
      </div>
    </main>
  );
}

