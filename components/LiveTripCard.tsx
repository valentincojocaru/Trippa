"use client";

/* ============================================================
   Live Trip Mode — shown on Home while the active trip is
   actually happening (today between start and end date).
   Today's plan with the next stop highlighted, quick expense
   entry in the local currency (converted live to EUR), and
   one-tap Map / SOS shortcuts.
   ============================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Siren, Plus, ChevronRight } from "lucide-react";
import Sheet from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { useT } from "@/lib/i18n";
import { currencyService } from "@/lib/services/currencyService";
import { expensesOf, setExpensesOf, spentOf, budgetOf } from "@/lib/tripBudget";
import { fmt, daysTo } from "@/lib/util";
import type { Trip } from "@/lib/types";

/** 1-based index of the trip day that is "today", or null when not on the trip. */
export function tripDayIndex(trip: Trip | null): number | null {
  if (!trip?.date) return null;
  const started = daysTo(trip.date);
  if (started == null || started > 0) return null; // hasn't started
  const idx = -started + 1;
  if (idx > (trip.days || trip.itin?.length || 0)) return null; // already over
  return idx;
}

export default function LiveTripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);

  const dayIdx = tripDayIndex(trip);
  if (dayIdx == null) return null;

  const day = trip.itin?.[dayIdx - 1];
  const items = day?.items || [];
  const nowHM = new Date().toTimeString().slice(0, 5);
  const nextIdx = items.findIndex((it) => (it.time || "00:00") >= nowHM);
  const spent = spentOf(trip);
  const budget = budgetOf(trip);
  const cur = (trip.currency || "EUR").toUpperCase();

  return (
    <>
      <div
        className="card mt-[18px] overflow-hidden"
        style={{ borderColor: "rgba(37,99,235,.35)", boxShadow: "0 0 0 1px rgba(37,99,235,.15), var(--shadow)" }}
      >
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <span className="badge">{t("lt.onTrip")}</span>
            <b className="text-[13px] t-acc">
              {t("lt.day")} {dayIdx}/{trip.days}
            </b>
          </div>
          <b className="text-[19px] block mt-2 tracking-[-0.02em]">
            {t("lt.today")} · {day?.city || trip.name}
          </b>
          <div className="dim text-[12px] mt-[2px]">
            €{fmt(spent)} / €{fmt(budget)} {t("lt.spentToday")}
          </div>
        </div>

        {/* today's plan */}
        <div className="px-4 pb-3">
          {items.length ? (
            items.slice(0, 4).map((it, i) => {
              const isNext = i === (nextIdx === -1 ? -2 : nextIdx);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-[7px] tap"
                  style={isNext ? { background: "var(--accent-soft)", margin: "0 -8px", padding: "7px 8px", borderRadius: 12 } : undefined}
                  onClick={() => router.push(`/trip/${trip.id}/itinerary`)}
                >
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: isNext ? "var(--accent)" : "var(--text-3)", width: 40 }}>
                    {it.time}
                  </span>
                  <span className="flex-1 text-[13.5px]" style={{ fontWeight: isNext ? 700 : 500 }}>
                    {it.t}
                  </span>
                  {isNext && <span className="badge">{t("lt.nextUp")}</span>}
                </div>
              );
            })
          ) : (
            <div className="muted text-[13px] py-1">{t("lt.noPlan")}</div>
          )}
          {items.length > 4 && (
            <div className="t-acc text-[12.5px] font-semibold tap flex items-center gap-1 mt-1" onClick={() => router.push(`/trip/${trip.id}/itinerary`)}>
              {t("lt.todayPlan")} <ChevronRight size={14} />
            </div>
          )}
        </div>

        {/* quick actions */}
        <div className="grid grid-cols-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button className="tap flex items-center justify-center gap-[6px] py-3 text-[12.5px] font-semibold" style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }} onClick={() => setAddOpen(true)}>
            <Plus size={15} strokeWidth={2.4} /> {t("lt.addExpense")}
          </button>
          <button className="tap flex items-center justify-center gap-[6px] py-3 text-[12.5px] font-semibold" style={{ background: "none", border: "none", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }} onClick={() => router.push(`/trip/${trip.id}/map`)}>
            <MapPin size={15} strokeWidth={2.2} /> {t("lt.map")}
          </button>
          <button className="tap flex items-center justify-center gap-[6px] py-3 text-[12.5px] font-semibold" style={{ background: "none", border: "none", color: "var(--pink)", cursor: "pointer" }} onClick={() => router.push("/tools/emergency")}>
            <Siren size={15} strokeWidth={2.2} /> {t("lt.sos")}
          </button>
        </div>
      </div>

      {addOpen && (
        <Sheet
          title={t("lt.addExpense")}
          submitLabel={t("lt.addExpense")}
          fields={[
            { key: "t", label: "•", ph: "e.g. Lunch / Prânz" },
            { key: "amt", label: `${cur}`, type: "number", ph: "0" },
            { key: "cat", label: "Category", type: "seg", options: ["Food", "Transport", "Activity", "Shopping", "Other"] },
          ]}
          onClose={async (r) => {
            setAddOpen(false);
            if (!r || !r.t || !(parseFloat(r.amt) > 0)) return;
            // amounts are entered in the local currency and stored in EUR
            const conv = cur === "EUR" ? { data: parseFloat(r.amt) } : await currencyService.convert(parseFloat(r.amt), cur, "EUR");
            const eur = conv.data ?? parseFloat(r.amt);
            const arr = [...expensesOf(trip)];
            arr.unshift({ t: r.t, cat: r.cat, eur, note: cur !== "EUR" ? `${r.amt} ${cur}` : "", day: 0 });
            setExpensesOf(trip, arr);
            toast(`+€${fmt(eur)}`);
          }}
        />
      )}
    </>
  );
}
