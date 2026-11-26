/**
 * Centralized TypeScript types for SubSaver.
 * Import from here instead of defining locally in each page/component.
 */

// ─── Subscription ─────────────────────────────────────────────────────────────

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled" | "trial" | "paused";

export interface Sub {
  id: number;
  name: string;
  price_cents: number;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  category: string;
  created_at: string;
  next_billing_date?: string;
  student_discount_applied?: boolean;
  split_with?: number;
  reminder_sent?: boolean;
  cancelled_at?: string | null;
  original_price_cents?: number | null;
}

/** A subscription with the number of days until its next charge. */
export interface UpcomingRenewal extends Sub {
  daysUntil: number | null;
}

// ─── Student Discount ─────────────────────────────────────────────────────────

export interface StudentDiscount {
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
  /** Official page the prices come from, and the date they were last checked (YYYY-MM-DD). */
  source_url?: string | null;
  price_checked_on?: string | null;
  // Appended by the API when returned alongside a subscription
  subscription_id?: number;
  already_applied?: boolean;
  /** What this user would save per month (their share, from their own price). */
  your_monthly_savings_cents?: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: number;
  email: string;
  is_verified: boolean;
  email_confirmed: boolean;
  edu_email?: string | null;
  created_at: string;
  is_demo?: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface CategoryData {
  category: string;
  total_cents: number;
  percentage: number;
}

export interface SpendingTrend {
  month: string;
  year: number;
  total_cents: number;
}

/** /api/analytics/trends and the "analytics" part of /api/dashboard/summary */
export interface AnalyticsData {
  trends: SpendingTrend[];
  breakdown: CategoryData[];
  total_monthly_cents: number;
}

export interface AnalyticsInsight {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  action: string;
  amount_cents?: number;
}

// ─── Savings ──────────────────────────────────────────────────────────────────

/** /api/student-discounts/savings and the "savings" part of /api/dashboard/summary */
export interface SavingsSummary {
  total_saved_monthly: number;
  total_saved_yearly: number;
  potential_monthly: number;
  potential_yearly: number;
  discounts_applied: number;
  discounts_available: number;
  student_saved_to_date: number;
  cancelled_saved_to_date: number;
  cancelled_count: number;
  total_saved_to_date: number;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface DashboardSummary {
  user: UserOut;
  subscriptions: Sub[];
  analytics: AnalyticsData;
  insights: AnalyticsInsight[];
  savings: SavingsSummary;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Fields accepted by POST /subscriptions and PATCH /subscriptions/{id} */
export interface SubscriptionPayload {
  name: string;
  price_cents: number;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  category: string;
  split_with: number;
  next_billing_date?: string;
}

// ─── Batch-check API response ─────────────────────────────────────────────────

/** Maps subscription ID (as string) → StudentDiscount | null */
export type BatchDiscountResult = Record<string, StudentDiscount | null>;
