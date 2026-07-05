"use client";

/* ============================================================
   Itinerary editor — timeline per day, add/edit/delete/reorder,
   flights + stays header, AI "suggest activities" (port of
   features2.js buildItinerary).
   ============================================================ */

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plane, ChevronUp, Pencil, Trash2, Plus } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import Sheet, { type SheetField } from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { useTrip } from "@/lib/useTrip";
import { store, useStoreVersion } from "@/lib/store";
import { affiliateService } from "@/lib/services/affiliateService";
import { replanDay, type ReplanReason } from "@/lib/agents/orchestrator";
import { useT } from "@/lib/i18n";
import { aiService } from "@/lib/services/aiService";
import { tripService } from "@/lib/services/userService";
import type { ItineraryDay, Trip } from "@/lib/types";

export default function ItineraryPage() {
  const params = useParams<{ id: string }>();
  const { trip, mounted } = useTrip(params.id);
  useStoreVersion();
  const [sheet, setSheet] = useState<null | {
    title: string;
    fields: SheetField[];
    submit: string;
    onDone: (v: Record<string, string> | null) => void;
  }>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [replanFor, setReplanFor] = useState<number | null>(null);
  const [replanning, setReplanning] = useState(false);
  const t = useT();

  if (!mounted) return <div className="screen-body" />;
  if (!trip)
    return (
      <>
        <ScreenHeader title="Itinerary" />
        <div className="screen-body">
          <EmptyState emoji="🗓️" text="Plan a trip and your day-by-day plan appears here." ctaLabel="Plan a trip" ctaHref="/plan" />
        </div>
      </>
    );

  const itin = store.get<ItineraryDay[]>("itin", trip.itin || []);
  const saveItin = (d: ItineraryDay[]) => {
    store.set("itin", d);
    // keep the saved trip in sync
    const t = tripService.byId(trip.id);
    if (t) tripService.save({ ...t, itin: d } as Trip);
  };
  const hotels = store.get("hotels", trip.hotels || []);
  const flights = store.get("flights", trip.flights || null) as Trip["flights"];
  const hasAnyItems = itin.some((d) => d.items && d.items.length);

  async function suggestActivities() {
    if (!(await aiService.available())) {
      toast("AI suggestions aren't available right now");
      return;
    }
    setAiBusy(true);
    const data = [...itin];
    try {
      for (let s = 0; s < data.length; s += 4) {
        const slice = data.slice(s, s + 4);
        const listing = slice.map((d, k) => `${s + k + 1}. ${d.day} in ${d.city}`).join("; ");
        const ask = `For a trip to ${trip!.name || ""}, ${trip!.country || ""}, give 3 real activities/places for EACH day: ${listing}. Return ONLY a minified JSON array (no backticks): [{"items":[{"time":"HH:MM","t":"real place","note":"max 4 words","cat":"Sights"}]}] one entry per day, same order, real named places.`;
        const txt = await aiService.complete(ask);
        const a = txt.indexOf("["),
          b = txt.lastIndexOf("]");
        let arr: any[] | null = null;
        try {
          arr = JSON.parse(txt.slice(a, b + 1));
        } catch {
          try {
            arr = JSON.parse(txt.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1"));
          } catch {}
        }
        slice.forEach((d, k) => {
          if (arr && arr[k] && arr[k].items) d.items = arr[k].items.map((it: any) => ({ ...it, icon: "view" }));
        });
      }
      saveItin(data);
      toast("Activities added ✨");
    } catch {
      toast("Could not add activities");
    } finally {
      setAiBusy(false);
    }
  }

  async function doReplan(di: number, reason: ReplanReason) {
    if (!(await aiService.available())) {
      toast(t("tk.importNoKey"));
      return;
    }
    setReplanning(true);
    try {
      const items = await replanDay(trip!, di, reason);
      const d = [...itin];
      d[di] = { ...d[di], items: items.map((it) => ({ ...it, icon: "view" })) };
      saveItin(d);
      toast(t("rp.done"));
      setReplanFor(null);
    } catch {
      toast(t("rp.fail"));
    } finally {
      setReplanning(false);
    }
  }

  const openAdd = (di: number) =>
    setSheet({
      title: "Add activity",
      fields: [
        { key: "time", label: "Time", value: "12:00", ph: "09:00" },
        { key: "t", label: "Activity", ph: "e.g. Old town walking tour" },
        { key: "note", label: "Note", ph: "optional" },
      ],
      submit: "Add",
      onDone: (r) => {
        setSheet(null);
        if (!r || !r.t) return;
        const d = [...itin];
        d[di].items.push({ time: r.time || "12:00", t: r.t, note: r.note, icon: "view" });
        d[di].items.sort((a, b) => a.time.localeCompare(b.time));
        saveItin(d);
        toast("Added to " + d[di].day);
      },
    });

  const openEdit = (di: number, ii: number) => {
    const it = itin[di].items[ii];
    setSheet({
      title: "Edit activity",
      fields: [
        { key: "time", label: "Time", value: it.time, ph: "09:00" },
        { key: "t", label: "Activity", value: it.t },
        { key: "note", label: "Note", value: it.note, ph: "optional" },
      ],
      submit: "Save",
      onDone: (r) => {
        setSheet(null);
        if (!r || !r.t) return;
        const d = [...itin];
        d[di].items[ii] = { ...it, time: r.time || it.time, t: r.t, note: r.note };
        d[di].items.sort((a, b) => a.time.localeCompare(b.time));
        saveItin(d);
      },
    });
  };

  return (
    <>
      <ScreenHeader title="Itinerary" backHref={`/trip/active`} />
      <div className="screen-body">
        {/* hero */}
        {trip.hero && (
          <div className="itin-hero" style={{ backgroundImage: `url('${trip.hero}')` }}>
            <div className="itin-hero-ov" />
            <div className="itin-hero-cap">
              <div className="text-[22px] font-extrabold tracking-[-0.02em] text-white">{trip.name}</div>
              <div className="text-[12.5px]" style={{ color: "rgba(255,255,255,.85)" }}>
                {trip.country} · {itin.length} days
              </div>
            </div>
          </div>
        )}

        {/* flights */}
        {flights && (
          <>
            <div className="sec-lbl mt-4 mb-2">FLIGHTS</div>
            <a
              className="card tap p-[14px] flex gap-3 items-center mb-[6px]"
              href={flights.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={() =>
                affiliateService.logClick({
                  provider: "aviasales",
                  bookingType: "flight",
                  destination: trip.name,
                  tripId: trip.id,
                })
              }
            >
              <span className="itile" style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Plane size={20} strokeWidth={2} />
              </span>
              <div className="flex-1">
                <b className="text-[14px]">
                  {flights.origin ? flights.origin + " → " : ""}
                  {(trip.name || "").split(/[,&]/)[0]}
                </b>
                <div className="dim text-[12px] mt-[1px]">
                  {flights.note || "Return flights"}
                  {flights.outDate ? " · " + flights.outDate : ""}
                </div>
              </div>
              <div className="text-right">
                <b className="text-[15px]">~€{flights.estEUR}</b>
                <div className="t-acc text-[11px] font-semibold">Search ›</div>
              </div>
            </a>
          </>
        )}

        {/* stays */}
        {hotels && hotels.length > 0 && (
          <>
            <div className="sec-lbl mt-4 mb-2">WHERE YOU STAY</div>
            {hotels.map((ht: any, i: number) => (
              <a
                key={ht.name + i}
                className="card tap overflow-hidden block mb-[10px]"
                href={ht.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: 0, textDecoration: "none", color: "inherit" }}
                onClick={() =>
                  affiliateService.logClick({
                    provider: "hotellook",
                    bookingType: "hotel",
                    destination: ht.city || trip.name,
                    tripId: trip.id,
                  })
                }
              >
                {ht.img && <div className="itin-hotel-img" style={{ backgroundImage: `url('${ht.img}')` }} />}
                <div className="p-[13px] flex gap-[11px] items-center">
                  <span className="itile glass2" style={{ width: 40, height: 40, borderRadius: 11, fontSize: 17 }}>
                    🏨
                  </span>
                  <div className="flex-1">
                    <b className="text-[14px]">{ht.name}</b>
                    <div className="dim text-[12px] mt-[1px]">
                      {ht.city}
                      {ht.area ? " · " + ht.area : ""} · {ht.nights} night{ht.nights > 1 ? "s" : ""}
                    </div>
                    {ht.why && <div className="t-acc text-[11px] mt-[2px]">{ht.why}</div>}
                  </div>
                  <div className="text-right">
                    <b className="text-[14px]">€{ht.priceEUR}</b>
                    <div className="dim text-[10px]">/night</div>
                  </div>
                </div>
              </a>
            ))}
          </>
        )}

        {/* daily plan */}
        <div className="sec-lbl mt-4 mb-2">DAILY PLAN{hasAnyItems ? "" : " · OPTIONAL"}</div>
        {!hasAnyItems && (
          <div className="card p-[18px] text-center mb-3">
            <div className="muted text-[13px] leading-[1.5]">
              No activities yet — your flights &amp; hotels are set.
              <br />
              Add your own below, or let AI suggest a day plan.
            </div>
            <button className="btn btn-primary tap mt-[14px]" style={{ height: 46 }} disabled={aiBusy} onClick={suggestActivities}>
              {aiBusy ? "✨ Thinking…" : "✨ Suggest activities with AI"}
            </button>
          </div>
        )}
        {itin.map((d, di) => (
          <div key={d.day + di}>
            <div className="sec-lbl mt-[18px] mb-2">
              {d.day.toUpperCase()} · {d.date} · {d.city}
            </div>
            {d.items.map((it, ii) => (
              <div className="itin-row" key={ii}>
                <div className="itin-time">{it.time}</div>
                <div className="itin-line">
                  <span />
                </div>
                <div className="itin-body">
                  <div className="flex items-center justify-between">
                    <b className="text-[14px]">{it.t}</b>
                    <div className="flex gap-[6px]">
                      <span
                        className="ic-btn tap"
                        onClick={() => {
                          if (ii === 0) return;
                          const dd = [...itin];
                          const arr = dd[di].items;
                          [arr[ii - 1], arr[ii]] = [arr[ii], arr[ii - 1]];
                          saveItin(dd);
                        }}
                      >
                        <ChevronUp size={15} strokeWidth={2.4} />
                      </span>
                      <span className="ic-btn tap" onClick={() => openEdit(di, ii)}>
                        <Pencil size={15} strokeWidth={2} />
                      </span>
                      <span
                        className="ic-btn tap"
                        style={{ color: "#C2456B" }}
                        onClick={() => {
                          const dd = [...itin];
                          dd[di].items.splice(ii, 1);
                          saveItin(dd);
                        }}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </span>
                    </div>
                  </div>
                  {it.note && <div className="dim text-[12px] mt-[2px]">{it.note}</div>}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <button className="btn-ghost-sm tap" onClick={() => openAdd(di)}>
                <Plus size={15} strokeWidth={2.2} />
                Add to {d.day}
              </button>
              <button className="btn-ghost-sm tap" style={{ color: "var(--accent)", borderColor: "rgba(37,99,235,.35)" }} onClick={() => setReplanFor(di)}>
                {t("rp.btn")}
              </button>
            </div>
          </div>
        ))}
      </div>
      {sheet && <Sheet title={sheet.title} fields={sheet.fields} submitLabel={sheet.submit} onClose={sheet.onDone} />}
      {replanFor != null && (
        <div
          className="tx-overlay on"
          onClick={(e) => {
            if (e.target === e.currentTarget && !replanning) setReplanFor(null);
          }}
        >
          <div className="tx-sheet">
            <b className="text-[16px]">{t("rp.title")}</b>
            <div className="dim text-[12.5px] mt-1 mb-4">{t("rp.reason")}</div>
            <div className="flex flex-col gap-[9px]">
              {(
                [
                  ["rain", t("rp.rain")],
                  ["closed", t("rp.closed")],
                  ["relaxed", t("rp.relaxed")],
                  ["adventurous", t("rp.adventurous")],
                ] as [ReplanReason, string][]
              ).map(([k, l]) => (
                <button
                  key={k}
                  className="wz-chip tap"
                  style={{ justifyContent: "flex-start" }}
                  disabled={replanning}
                  onClick={() => doReplan(replanFor, k)}
                >
                  {replanning ? "✨ …" : l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
