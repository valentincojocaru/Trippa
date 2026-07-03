/* ============================================================
   Trippa — lib/services/config.ts
   Single source of truth for API keys + mock/real mode.

   Resolution order for every key:
     1) process.env / NEXT_PUBLIC_* (build inject)
     2) localStorage 'trippa.env.KEY'  ← set in-app (Settings)
     3) ''                            ← empty → provider stays in MOCK mode

   A service runs in REAL mode only when its required key(s) resolve.
   Otherwise it returns clearly-labelled mock data (meta.mock === true),
   so the app is always fully usable with no invented "real" values.
   ============================================================ */

import type { ServiceResult } from "@/lib/types";

/* NEXT_PUBLIC_* keys must be referenced statically so Next.js inlines them. */
const PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
};

export function env(key: string): string {
  const v = PUBLIC_ENV[key];
  if (v != null && v !== "") return String(v);
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return String(process.env[key]);
  }
  if (typeof window !== "undefined") {
    try {
      const l = window.localStorage.getItem("trippa.env." + key);
      if (l != null && l !== "") return l;
    } catch {}
  }
  return "";
}

export function setEnv(key: string, val: string) {
  try {
    window.localStorage.setItem("trippa.env." + key, val == null ? "" : String(val));
  } catch {}
}

/* Which env keys each provider needs to leave mock mode. */
export const REQUIRES: Record<string, string[]> = {
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  maps: ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"],
  places: ["GOOGLE_PLACES_API_KEY"],
  flights: ["TRAVELPAYOUTS_API_TOKEN"],
  hotels: ["TRAVELPAYOUTS_API_TOKEN"],
  weather: ["OPENWEATHER_API_KEY"], // app also has a keyless Open-Meteo fallback
  currency: ["EXCHANGE_RATE_API_KEY"], // app also has a keyless Frankfurter fallback
  email: ["RESEND_API_KEY"],
};

export function isReal(provider: string): boolean {
  const need = REQUIRES[provider] || [];
  return need.length > 0 && need.every((k) => env(k) !== "");
}

export const mode = (p: string) => (isReal(p) ? "real" : "mock");

/* Affiliate markers are public by design — safe in the client. */
export const affiliate = {
  get travelpayoutsMarker() {
    return env("TRAVELPAYOUTS_MARKER") || "543809";
  },
  get bookingAffiliateId() {
    return env("BOOKING_AFFILIATE_ID") || "";
  },
  get cjWebsiteId() {
    return env("CJ_WEBSITE_ID") || "";
  },
};

/* Helper so every service tags its payloads consistently. */
export function wrap<T>(
  provider: string,
  data: T,
  extra?: Partial<ServiceResult<T>["meta"]>
): ServiceResult<T> {
  return {
    data,
    meta: { provider, mock: !isReal(provider), at: Date.now(), ...(extra || {}) },
  };
}
