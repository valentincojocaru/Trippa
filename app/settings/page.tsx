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
import { useT, getLang, setLang } from "@/lib/i18n";
import { getTheme, setTheme } from "@/components/ThemeApplier";
import { store, useStoreVersion } from "@/lib/store";

const KEYS: { k: string; label: string; provider: string; note: string }[] = [
  { k: "OPENAI_API_KEY", label: "OpenAI API key", provider: "openai", note: "AI trip generation & concierge" },
  { k: "ANTHROPIC_API_KEY", label: "Anthropic API key", provider: "anthropic", note: "Alternative AI provider" },
  { k: "GEMINI_API_KEY", label: "Gemini API key", provider: "gemini", note: "Fast-tier AI routing" },
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
  const t = useT();
  useStoreVersion();
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
      <ScreenHeader title={t("pf.settings")} backHref="/profile" />
      <div className="screen-body">
        <div className="sec-lbl mb-2">{t("st.language")}</div>
        <div className="seg acc mb-5">
          {(["ro", "en"] as const).map((l) => (
            <span key={l} className={getLang() === l ? "on" : ""} onClick={() => setLang(l)}>
              {l === "ro" ? "🇷🇴 Română" : "🇬🇧 English"}
            </span>
          ))}
        </div>

        <div className="sec-lbl mb-2">{t("st.theme")}</div>
        <div className="seg acc mb-5">
          {(["auto", "light", "dark"] as const).map((m) => (
            <span key={m} className={getTheme() === m ? "on" : ""} onClick={() => setTheme(m)}>
              {m === "auto" ? t("st.auto") : m === "light" ? t("st.light") : t("st.dark")}
            </span>
          ))}
        </div>

        <div className="sec-lbl mb-2">{t("st.apiKeys")}</div>
        <div className="card p-[14px] flex flex-col gap-[13px]">
          <div className="muted text-[12.5px] leading-[1.5]">
            {t("st.keysNote")}
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
              toast(t("st.keysSaved"));
            }}
          >
            {t("st.saveKeys")}
          </button>
        </div>

        <div className="sec-lbl mt-5 mb-2">{t("st.privacy")}</div>
        <div className="card p-[14px]">
          <div className="muted text-[12.5px] leading-[1.5]">
            {t("st.privacyNote")}
          </div>
        </div>

        <div className="sec-lbl mt-5 mb-2">{t("st.account")}</div>
        <button
          className="btn btn-ghost tap"
          onClick={() => {
            userService.signOut();
            toast("Signed out");
            router.push("/auth");
          }}
        >
          {t("st.signOut")}
        </button>
      </div>
    </>
  );
}
