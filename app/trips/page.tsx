"use client";

/* My Trips — Upcoming / Past / Wishlist tabs with photo cards
   (port of redesign.js buildMyTrips). */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, ChevronRight, Trash2 } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { tripService } from "@/lib/services/userService";
import { daysTo, money } from "@/lib/util";
import TripImage from "@/components/TripImage";
import { useT } from "@/lib/i18n";
import type { Favorite, Trip } from "@/lib/types";

export default function TripsPage() {
  const router = useRouter();
  const t = useT();
  useStoreVersion();
  const [tab, setTab] = useState<"upcoming" | "past" | "wishlist">("upcoming");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="screen-body" />;

  const all = store.get<Trip[]>("trips", []);
  const up = all.filter((x) => {
    const d = daysTo(x.date);
    return d == null || d >= 0;
  });
  const past = all.filter((x) => {
    const d = daysTo(x.date);
    return d != null && d < 0;
  });
  const wish = store.get<Favorite[]>("favs", []);

  const open = (tp: Trip) => {
    tripService.activate(tp);
    router.push("/trip/active"); // canonical route → resolves to the just-activated trip
  };

  const empty = (title: string, sub: string) => (
    <div className="card p-[30px] text-center flex flex-col items-center">
      <div className="itile acc" style={{ width: 64, height: 64, borderRadius: 22, fontSize: 28 }} aria-hidden>
        🧳
      </div>
      <b className="block mt-3 text-[15px]">{title}</b>
      <div className="muted text-[13px] mt-[5px] leading-[1.5]">{sub}</div>
    </div>
  );

  const row = (tp: Trip) => {
    const d = daysTo(tp.date);
    return (
      <div className="mt-row tap" key={tp.id} onClick={() => open(tp)}>
        <TripImage name={tp.name} country={tp.country} hero={tp.hero} className="mt-row-img" />
        <div className="flex-1">
          <b className="text-[15px]">{tp.name}</b>
          <div className="dim text-[12px] mt-[2px]">
            {tp.country || ""} · {money(tp.budget || 0)}
          </div>
        </div>
        <div className="text-right" style={{ flex: "0 0 auto" }}>
          {d != null && d >= 0 ? (
            <>
              <b className="text-[15px]" style={{ color: "var(--accent)" }}>
                {d}
              </b>
              <div className="dim text-[10px]">{t("tr.days")}</div>
            </>
          ) : (
            <span
              className="ic-btn tap"
              style={{ color: "#C2456B" }}
              onClick={(e) => {
                e.stopPropagation();
                tripService.remove(tp.id);
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
        <b className="text-[22px] tracking-[-0.02em]">{t("tr.myTrips")}</b>
        <button className="mt-new tap" onClick={() => router.push("/plan")}>
          <Plus size={15} color="#fff" strokeWidth={2.4} />
          {t("tr.new")}
        </button>
      </div>

      <div className="mt-tabs mt-[18px]">
        {(
          [
            ["upcoming", t("tr.upcoming")] as const,
            ["past", t("tr.past")] as const,
            ["wishlist", t("tr.wishlist")] as const,
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
                <ChevronRight size={17} color="var(--text-3)" strokeWidth={2} />
              </div>
            ))
          ) : (
            empty(t("tr.noWish"), t("tr.noWishSub"))
          )
        ) : !data.length ? (
          empty(
            tab === "upcoming" ? t("tr.noUpcoming") : t("tr.noPast"),
            tab === "upcoming" ? t("tr.noUpcomingSub") : t("tr.noPastSub")
          )
        ) : tab === "upcoming" ? (
          <>
            {(() => {
              const f = data[0];
              const d = daysTo(f.date);
              return (
                <div className="mt-feat tap" onClick={() => open(f)}>
                  <TripImage name={f.name} country={f.country} hero={f.hero} className="mt-feat-img" />
                  <div className="mt-feat-ov" />
                  <div className="mt-feat-cap">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[21px] font-extrabold text-white tracking-[-0.02em]">{f.name}</div>
                        <div className="text-[12.5px] mt-[2px]" style={{ color: "rgba(255,255,255,.85)" }}>
                          {f.country || ""} · {f.days} {t("tr.days")}
                        </div>
                      </div>
                      {d != null && <span className="mt-badge">{d > 0 ? t("tr.inDays") + " " + d + "d" : d === 0 ? t("tr.today") : t("tr.now")}</span>}
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
