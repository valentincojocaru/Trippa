/* ============================================================
   Trippa — lib/services/config.ts
   Single source of truth for config + mock/real mode.

   Keys resolve ONLY from the environment:
     - NEXT_PUBLIC_* : safe, public, inlined at build (URLs, map key)
     - server-side secrets (OPENAI_API_KEY, …) : available only in the
       Node runtime / API routes, never shipped to the client bundle.

   Secrets are NEVER read from or written to the browser (no localStorage,
   sessionStorage, IndexedDB or Capacitor storage). On the client a secret
   simply resolves to '' and the provider stays in clearly-labelled MOCK
   mode, so the app is always usable and no key is ever exposed.
   ============================================================ */

import type { ServiceResult } from "@/lib/types";

/* NEXT_PUBLIC_* keys must be referenced statically so Next.js inlines them.
   These are public by definition — safe to be in the client bundle. */
const PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

export function env(key: string): string {
  const v = PUBLIC_ENV[key];
  if (v != null && v !== "") return String(v);
  // Server-side secrets: readable only in the Node runtime (API routes).
  // On the client `process.env.<SECRET>` is undefined by design.
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return String(process.env[key]);
  }
  return "";
}

/* Which env keys each provider needs to leave mock mode. */
export const REQUIRES: Record<string, string[]> = {
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  gemini: ["GEMINI_API_KEY"],
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
