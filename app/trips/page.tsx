"use client";

/* My Trips — Upcoming / Past / Wishlist tabs with photo cards
   (port of redesign.js buildMyTrips). */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, ChevronRight, Trash2 } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { tripService } from "@/lib/services/userService";
import { daysTo, money } from "@/lib/util";
import type { Favorite, Trip } from "@/lib/types";

const FALLBACK = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=70";

export default function TripsPage() {
  const router = useRouter();
  useStoreVersion();
  const [tab, setTab] = useState<"upcoming" | "past" | "wishlist">("upcoming");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="screen-body" />;

  const all = store.get<Trip[]>("trips", []);
  const up = all.filter((t) => {
    const d = daysTo(t.date);
    return d == null || d >= 0;
  });
  const past = all.filter((t) => {
    const d = daysTo(t.date);
    return d != null && d < 0;
  });
  const wish = store.get<Favorite[]>("favs", []);
  const heroOf = (t: Trip) => t.hero || FALLBACK;

  const open = (t: Trip) => {
    tripService.activate(t);
    router.push("/trip/" + t.id);
  };

  const empty = (t: string, s: string) => (
    <div className="card p-[30px] text-center">
      <div className="text-[34px]">🧳</div>
      <b className="block mt-[10px] text-[15px]">{t}</b>
      <div className="muted text-[13px] mt-[5px] leading-[1.5]">{s}</div>
    </div>
  );

  const row = (t: Trip) => {
    const d = daysTo(t.date);
    return (
      <div className="mt-row tap" key={t.id} onClick={() => open(t)}>
        <div className="mt-row-img" style={{ backgroundImage: `url('${heroOf(t)}')` }} />
        <div className="flex-1">
          <b className="text-[15px]">{t.name}</b>
          <div className="dim text-[12px] mt-[2px]">
            {t.country || ""} · {money(t.budget || 0)}
          </div>
        </div>
        <div className="text-right" style={{ flex: "0 0 auto" }}>
          {d != null && d >= 0 ? (
            <>
              <b className="text-[15px]" style={{ color: "var(--accent)" }}>
                {d}
              </b>
              <div className="dim text-[10px]">days</div>
            </>
          ) : (
            <span
              className="ic-btn tap"
              style={{ color: "#C2456B" }}
              onClick={(e) => {
                e.stopPropagation();
                tripService.remove(t.id);
              }}
            >
              <Trash2 size={15} strokeWidth={2} />
            </span>
          )}
        </div>
      </div>
    );
  };

  const data = tab === "upcoming" ? up : past;

  return (
    <div className="screen-body">
      <div className="flex items-center justify-between">
        <b className="text-[22px] tracking-[-0.02em]">My Trips</b>
        <button className="mt-new tap" onClick={() => router.push("/plan")}>
          <Plus size={15} color="#fff" strokeWidth={2.4} />
          New Trip
        </button>
      </div>

      <div className="mt-tabs mt-[18px]">
        {(
          [
            ["upcoming", "Upcoming"],
            ["past", "Past"],
            ["wishlist", "Wishlist"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className={"mt-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
            {l}
          </span>
        ))}
      </div>

      <div className="mt-[18px]">
        {tab === "wishlist" ? (
          wish.length ? (
            wish.map((f, i) => (
              <div className="card tap p-[13px] flex gap-3 items-center mb-[11px]" key={i} onClick={() => router.push("/tools/guide")}>
                <span className="itile" style={{ width: 46, height: 46, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <MapPin size={20} strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <b className="text-[14.5px]">{f.name}</b>
                  <div className="dim text-[12px] mt-[2px]">
                    {f.city || ""} · {f.tag || "Saved"}
                  </div>
                </div>
                <ChevronRight size={17} color="#9295A0" strokeWidth={2} />
              </div>
            ))
          ) : (
            empty("No saved places yet", "Tap the bookmark on places in City Guide to save them.")
          )
        ) : !data.length ? (
          empty(
            tab === "upcoming" ? "No upcoming trips" : "No past trips",
            tab === "upcoming" ? "Tap “New Trip” to plan one with AI." : "Your finished trips will appear here."
          )
        ) : tab === "upcoming" ? (
          <>
            {(() => {
              const f = data[0];
              const d = daysTo(f.date);
              return (
                <div className="mt-feat tap" onClick={() => open(f)}>
                  <div className="mt-feat-img" style={{ backgroundImage: `url('${heroOf(f)}')` }} />
                  <div className="mt-feat-ov" />
                  <div className="mt-feat-cap">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[21px] font-extrabold text-white tracking-[-0.02em]">{f.name}</div>
                        <div className="text-[12.5px] mt-[2px]" style={{ color: "rgba(255,255,255,.85)" }}>
                          {f.country || ""} · {f.days} days
                        </div>
                      </div>
                      {d != null && <span className="mt-badge">{d > 0 ? "In " + d + "d" : d === 0 ? "Today" : "Now"}</span>}
                    </div>
                  </div>
                </div>
              );
            })()}
            {data.slice(1).map(row)}
          </>
        ) : (
          data.map(row)
        )}
      </div>
    </div>
  );
}
