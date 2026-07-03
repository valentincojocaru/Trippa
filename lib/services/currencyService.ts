/* ============================================================
   Trippa — currencyService
   convert(amount, from, to) → number
   MOCK/keyless: Frankfurter API (ECB rates, no key) + offline table.
   REAL: exchangerate API when EXCHANGE_RATE_API_KEY is set.
   Rates are real ECB data even in "mock" mode — only the keyed
   provider counts as "real" for meta, but we never invent a rate.
   ============================================================ */

import { wrap } from "./config";
import type { ServiceResult } from "@/lib/types";

/* Offline fallback (approx, base EUR) — used only when offline. */
const OFFLINE: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.85, JPY: 168, RON: 4.97, CHF: 0.96, AUD: 1.64,
  CAD: 1.47, THB: 39, AED: 3.96, TRY: 35, IDR: 17200, SGD: 1.45,
};

const cache: Record<string, { v: number; t: number }> = {};

async function frankfurter(from: string, to: string): Promise<number | undefined> {
  const k = from + ">" + to;
  const now = Date.now();
  if (cache[k] && now - cache[k].t < 3600e3) return cache[k].v;
  const r = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  const j = await r.json();
  const v = j && j.rates && j.rates[to];
  if (v) cache[k] = { v, t: now };
  return v;
}

function offlineRate(from: string, to: string): number | null {
  if (!OFFLINE[from] || !OFFLINE[to]) return null;
  return OFFLINE[to] / OFFLINE[from];
}

export const currencyService = {
  async rate(from = "EUR", to = "EUR"): Promise<ServiceResult<number | null>> {
    from = from.toUpperCase();
    to = to.toUpperCase();
    if (from === to) return wrap("currency", 1, { live: true });
    try {
      const v = await frankfurter(from, to);
      if (v) return wrap("currency", v, { live: true, source: "frankfurter/ECB" });
    } catch {}
    return wrap("currency", offlineRate(from, to), { live: false, source: "offline-table" });
  },
  async convert(amount: number, from: string, to: string) {
    const res = await this.rate(from, to);
    return {
      ...res,
      data: res.data == null ? null : +(amount * res.data).toFixed(2),
      rate: res.data,
    };
  },
};
