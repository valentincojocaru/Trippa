"use client";

/* City guide — places from the active trip's itinerary, filterable
   by city/category, save to favorites (port of features2.js). */

import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { Bookmark } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { toast } from "@/components/Toast";
import type { Favorite, ItineraryDay } from "@/lib/types";

const CAT_EMOJI: Record<string, string> = {
  Sights: "📍", Food: "🍽️", Views: "🌅", Shopping: "🛍️", Nature: "🌿",
  Nightlife: "🌃", Culture: "🏛️", Beach: "🏖️", Transport: "🚆", Hotel: "🏨", Other: "✨",
};

export default function GuidePage() {
  useStoreVersion();
  const [cat, setCat] = useState("All");
  const [city, setCity] = useState("All");
  const [mounted, setMounted] = useState(false);
  useState(() => {
    if (typeof window !== "undefined") setTimeout(() => setMounted(true), 0);
  });

  const itin = store.get<ItineraryDay[]>("itin", []);
  const seen = new Set<string>();
  const all: { name: string; city: string; cat: string; note: string; emoji: string }[] = [];
  itin.forEach((d) =>
    (d.items || []).forEach((it) => {
      const name = it.t;
      if (!name || seen.has(name)) return;
      seen.add(name);
      const c = it.cat || "Sights";
      all.push({ name, city: d.city || "", cat: c, note: it.note || "", emoji: CAT_EMOJI[c] || CAT_EMOJI.Other });
    })
  );
  const favs = store.get<Favorite[]>("favs", []);

  if (!mounted) return <div className="screen-body" />;

  if (!all.length)
    return (
      <>
        <ScreenHeader title="City Guide" backHref="/" />
        <div className="screen-body">
          <EmptyState
            emoji="🧭"
            text={"Plan a trip with AI and your day-by-day places\nshow up here — anywhere in the world."}
            ctaLabel="Plan a trip"
            ctaHref="/plan"
          />
        </div>
      </>
    );

  const cities = [...new Set(all.map((g) => g.city).filter(Boolean))];
  const cats = ["All", ...new Set(all.map((g) => g.cat))];
  const list = all.filter((g) => (city === "All" || g.city === city) && (cat === "All" || g.cat === cat));

  return (
    <>
      <ScreenHeader title="City Guide" backHref="/" />
      <div className="screen-body">
        {cities.length > 1 && (
          <div className="seg mb-3">
            <span className={city === "All" ? "on" : ""} onClick={() => setCity("All")}>
              All
            </span>
            {cities.map((c) => (
              <span key={c} className={c === city ? "on" : ""} onClick={() => setCity(c)}>
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto mb-[14px] pb-[2px]">
          {cats.map((c) => (
            <span key={c} className={"pill tap" + (c === cat ? " on" : "")} onClick={() => setCat(c)}>
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-[11px]">
          {list.map((g) => {
            const saved = favs.some((f) => f.name === g.name);
            return (
              <div className="card p-[13px] flex gap-3 items-start" key={g.name}>
                <span className="itile glass2" style={{ width: 42, height: 42, borderRadius: 12, fontSize: 20 }}>
                  {g.emoji}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <b className="text-[14px]">{g.name}</b>
                    <span className="badge">{g.cat}</span>
                  </div>
                  {(g.note || g.city) && (
                    <div className="muted text-[12.5px] mt-[3px] leading-[1.4]">
                      {[g.city, g.note].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <span
                  className="ic-btn tap"
                  style={{ color: saved ? "var(--accent)" : "var(--text-3)" }}
                  onClick={() => {
                    const d = [...favs];
                    const idx = d.findIndex((f) => f.name === g.name);
                    if (idx >= 0) {
                      d.splice(idx, 1);
                      toast("Removed from saved");
                    } else {
                      d.unshift({ name: g.name, city: g.city, tag: g.cat });
                      toast("Saved");
                    }
                    store.set("favs", d);
                  }}
                >
                  <Bookmark size={18} strokeWidth={2} fill={saved ? "currentColor" : "none"} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
