"use client";

/* ============================================================
   Settings — sign out, privacy note, and API-key fields that write
   to localStorage['trippa.env.*'] — filling a key flips the matching
   service from mock to real (config resolution order).
   Keys pasted here never leave the device.
   ============================================================ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHeader from "@/components/ScreenHeader";
import { env, setEnv, isReal } from "@/lib/services/config";
import { userService } from "@/lib/services/userService";
import { toast } from "@/components/Toast";
import { store } from "@/lib/store";

const KEYS: { k: string; label: string; provider: string; note: string }[] = [
  { k: "OPENAI_API_KEY", label: "OpenAI API key", provider: "openai", note: "AI trip generation & concierge" },
  { k: "ANTHROPIC_API_KEY", label: "Anthropic API key", provider: "anthropic", note: "Alternative AI provider" },
  { k: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL", provider: "supabase", note: "Cloud sync & auth" },
  { k: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase anon key", provider: "supabase", note: "Cloud sync & auth" },
  { k: "TRAVELPAYOUTS_API_TOKEN", label: "Travelpayouts token", provider: "flights", note: "Live flight & hotel prices" },
  { k: "GOOGLE_PLACES_API_KEY", label: "Google Places key", provider: "places", note: "Global place search" },
  { k: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", label: "Google Maps key", provider: "maps", note: "Google map instead of OSM" },
  { k: "OPENWEATHER_API_KEY", label: "OpenWeather key", provider: "weather", note: "Optional — Open-Meteo works keyless" },
  { k: "EXCHANGE_RATE_API_KEY", label: "Exchange-rate key", provider: "currency", note: "Optional — ECB rates work keyless" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const v: Record<string, string> = {};
    KEYS.forEach(({ k }) => (v[k] = env(k)));
    setVals(v);
    setMounted(true);
  }, []);
  if (!mounted) return <div className="screen-body" />;

  return (
    <>
      <ScreenHeader title="Settings" backHref="/profile" />
      <div className="screen-body">
        <div className="sec-lbl mb-2">API KEYS</div>
        <div className="card p-[14px] flex flex-col gap-[13px]">
          <div className="muted text-[12.5px] leading-[1.5]">
            Keys are stored only on this device (localStorage) and flip the matching service from
            labelled demo data to live data. Leave any key blank — the app keeps working.
          </div>
          {KEYS.map(({ k, label, provider, note }) => (
            <div className="field" key={k}>
              <label>
                {label} <span className="dim">· {note}</span>{" "}
                {isReal(provider) && (
                  <span className="badge" style={{ background: "rgba(22,163,74,.14)", color: "var(--green)" }}>
                    live
                  </span>
                )}
              </label>
              <input
                className="tx-input"
                type="password"
                placeholder="paste key…"
                value={vals[k] || ""}
                onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))}
                onBlur={() => {
                  setEnv(k, vals[k] || "");
                  store.set("_envBump", Date.now()); // re-render dependents
                }}
              />
            </div>
          ))}
          <button
            className="btn btn-primary tap"
            style={{ height: 46 }}
            onClick={() => {
              KEYS.forEach(({ k }) => setEnv(k, vals[k] || ""));
              store.set("_envBump", Date.now());
              toast("Keys saved on this device ✓");
            }}
          >
            Save keys
          </button>
        </div>

        <div className="sec-lbl mt-5 mb-2">PRIVACY</div>
        <div className="card p-[14px]">
          <div className="muted text-[12.5px] leading-[1.5]">
            Trips, expenses, documents and journal entries live on this device (and sync to your own
            Supabase project when configured). Trippa never processes payments — bookings hand off to
            trusted partners. Affiliate markers are public by design.
          </div>
        </div>

        <div className="sec-lbl mt-5 mb-2">ACCOUNT</div>
        <button
          className="btn btn-ghost tap"
          onClick={() => {
            userService.signOut();
            toast("Signed out");
            router.push("/auth");
          }}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
