/**
 * Money helpers shared by every view, so the dashboard, the customize preview
 * and the widgets always show the same numbers as the backend.
 *
 * All amounts are integer cents. Division truncates, exactly like the
 * backend's `_monthly_cost` in routers/dashboard.py.
 */

type Priced = { price_cents: number; billing_cycle: string; split_with?: number | null };

/** The user's own share of one charge: the full price divided by the people sharing it. */
export function shareCents(priceCents: number, splitWith?: number | null): number {
  return Math.floor(priceCents / Math.max(1, splitWith ?? 1));
}

/** The user's share per month; a yearly price is spread over 12 months. */
export function monthlyShareCents(sub: Priced): number {
  const share = shareCents(sub.price_cents, sub.split_with);
  return sub.billing_cycle === "yearly" ? Math.floor(share / 12) : share;
}

/** Name shown in greetings: "Demo" for temporary demo accounts, otherwise the part before "@". */
export function displayName(user: { email?: string; is_demo?: boolean } | null | undefined): string {
  if (!user) return "there";
  if (user.is_demo) return "Demo";
  return user.email?.split("@")[0] ?? "there";
}
