/**
 * currency.ts — Real currency conversion utility.
 *
 * M-5 fix: Rates are fetched from the backend (/api/rates) which caches them
 * server-side for 1 hour. This avoids the 1500 req/month limit on open.er-api.com
 * by sharing one upstream request across all users.
 *
 * Frontend still caches in localStorage for 30 min to avoid repeat fetches
 * within the same session.
 */

export type Currency = "USD" | "EUR" | "GBP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
};

const RATES_CACHE_KEY = "subsaver_fx_rates";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min client-side cache

// Updated May 2026 fallback rates (L-8)
const FALLBACK_RATES: Record<string, number> = { USD: 1, EUR: 0.93, GBP: 0.79 };

interface RatesCache {
  rates: Record<string, number>;
  cachedAt: number;
}

/**
 * Fetch USD-based exchange rates from the backend (which caches them server-side).
 * Falls back to hardcoded approximate rates if the backend is unavailable.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // 1. Try client-side localStorage cache first
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(RATES_CACHE_KEY);
      if (cached) {
        const parsed: RatesCache = JSON.parse(cached);
        if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
          return parsed.rates;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // 2. Fetch from backend (server caches for 1 hour)
  try {
    const res = await fetch("/backend_api/api/rates", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rates: Record<string, number> = data.rates ?? FALLBACK_RATES;

    // Cache client-side for 30 min
    if (typeof window !== "undefined") {
      const toCache: RatesCache = { rates, cachedAt: Date.now() };
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(toCache));
    }

    return rates;
  } catch (err) {
    console.warn("[currency] Failed to fetch rates from backend, using fallback:", err);
    return FALLBACK_RATES;
  }
}

/**
 * Convert an amount in USD cents to another currency.
 * Returns a float (not cents) in the target currency.
 */
export function convertFromUsdCents(
  usdCents: number,
  to: Currency,
  rates: Record<string, number>
): number {
  if (to === "USD") return usdCents / 100;
  const rate = rates[to] ?? 1;
  return (usdCents / 100) * rate;
}

/**
 * Format a USD-cents amount as a display string in the given currency.
 * Example: formatMoney(499, "EUR", rates) → "€4.64"
 */
export function formatMoney(
  usdCents: number,
  currency: Currency,
  rates: Record<string, number>
): string {
  const amount = convertFromUsdCents(usdCents, currency, rates);
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toFixed(2)}`;
}
