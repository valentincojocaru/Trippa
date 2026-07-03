/* ============================================================
   Trippa — supabaseClient
   Thin REST wrapper over Supabase (matches the reference contract).
   Falls back to localStorage when keys are missing, so the whole
   app keeps working offline / pre-config.
   ============================================================ */

import { env, isReal } from "./config";

const url = () => env("NEXT_PUBLIC_SUPABASE_URL");
const key = () => env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

function token(): string {
  try {
    const s = JSON.parse(window.localStorage.getItem("trippa.session") || "null") || {};
    return s.access_token || key();
  } catch {
    return key();
  }
}

function headers() {
  return {
    apikey: key(),
    Authorization: "Bearer " + token(),
    "Content-Type": "application/json",
  };
}

export const supabaseClient = {
  enabled: () => isReal("supabase"),

  async insert(table: string, row: Record<string, unknown>) {
    if (!this.enabled()) return { local: true };
    const r = await fetch(url() + "/rest/v1/" + table, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    return { ok: r.ok, status: r.status };
  },

  async select(table: string, query?: string): Promise<any[]> {
    if (!this.enabled()) return [];
    const r = await fetch(url() + "/rest/v1/" + table + (query ? "?" + query : ""), {
      headers: headers(),
    });
    return r.ok ? r.json() : [];
  },

  async signIn(email: string, password: string) {
    if (!this.enabled()) throw new Error("supabase-not-configured");
    const r = await fetch(url() + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: key(), "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || "sign-in failed");
    window.localStorage.setItem("trippa.session", JSON.stringify(j));
    return j;
  },

  async signUp(email: string, password: string) {
    if (!this.enabled()) throw new Error("supabase-not-configured");
    const r = await fetch(url() + "/auth/v1/signup", {
      method: "POST",
      headers: { apikey: key(), "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.msg || j.error_description || "sign-up failed");
    if (j.access_token) window.localStorage.setItem("trippa.session", JSON.stringify(j));
    return j;
  },

  signOut() {
    try {
      window.localStorage.removeItem("trippa.session");
    } catch {}
  },
};
