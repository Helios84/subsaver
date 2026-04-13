/**
 * Centralized TypeScript types for SubSaver.
 * Import from here instead of defining locally in each page/component.
 */

// ─── Subscription ─────────────────────────────────────────────────────────────

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled";

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
  // Appended by the API when returned alongside a subscription
  subscription_id?: number;
  already_applied?: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: number;
  email: string;
  is_verified: boolean;
  edu_email?: string | null;
  created_at: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface CategoryData {
  category: string;
  total_cents: number;
  percentage: number;
}

export interface SpendingTrend {
  month: string;
  total: number;
}

export interface AnalyticsInsight {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
}

// ─── Batch-check API response ─────────────────────────────────────────────────

/** Maps subscription ID (as string) → StudentDiscount | null */
export type BatchDiscountResult = Record<string, StudentDiscount | null>;
