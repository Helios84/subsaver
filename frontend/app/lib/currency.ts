/**
 * currency.ts — Real currency conversion utility.
 *
 * Uses open.er-api.com (free, no key, 1500 req/month) to fetch live rates.
 * Rates are cached in localStorage for 1 hour to avoid hitting limits.
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
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RatesCache {
  rates: Record<string, number>;
  cachedAt: number;
}

/**
 * Fetch USD-based exchange rates with 1-hour localStorage cache.
 * Falls back to { USD: 1, EUR: 0.92, GBP: 0.79 } if network fails.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
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
      // ignore parse errors — fetch fresh
    }
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rates: Record<string, number> = data.rates ?? {};

    if (typeof window !== "undefined") {
      const toCache: RatesCache = { rates, cachedAt: Date.now() };
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(toCache));
    }

    return rates;
  } catch (err) {
    console.warn("[currency] Failed to fetch exchange rates, using fallback:", err);
    // Approximate fallback rates (April 2026)
    return { USD: 1, EUR: 0.92, GBP: 0.79 };
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
 * Example: formatMoney(499, "EUR", rates) → "€4.59"
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
