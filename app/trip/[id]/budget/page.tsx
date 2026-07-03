"use client";

/* ============================================================
   Budget & expenses — total vs spent, category breakdown bars,
   expense timeline, over-budget indicator (port of features.js).
   The budget itself is user-owned; expenses only ever compare
   against it — never resize it.
   ============================================================ */

import { useState } from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { useTrip } from "@/lib/useTrip";
import { store, useStoreVersion } from "@/lib/store";
import { budgetOf, setBudgetOf, expensesOf, setExpensesOf } from "@/lib/tripBudget";
import { fmt, daysTo } from "@/lib/util";

const CATS: Record<string, { c: string; bg: string; e: string }> = {
  Food: { c: "var(--purple)", bg: "rgba(124,92,255,.14)", e: "🍜" },
  Transport: { c: "var(--green)", bg: "rgba(22,163,74,.14)", e: "🚆" },
  Activity: { c: "var(--accent)", bg: "var(--accent-soft)", e: "🎟️" },
  Hotel: { c: "var(--blue)", bg: "rgba(37,99,235,.14)", e: "🏨" },
  Shopping: { c: "var(--yellow)", bg: "rgba(202,138,4,.16)", e: "🛍️" },
  Other: { c: "var(--text-2)", bg: "var(--surface-2)", e: "💠" },
};

export default function BudgetPage() {
  const params = useParams<{ id: string }>();
  const { trip, mounted } = useTrip(params.id);
  useStoreVersion();
  const [mode, setMode] = useState<0 | 1 | 2>(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(false);

  if (!mounted) return <div className="screen-body" />;

  // budget & expenses are scoped to THIS trip (params.id), not global state
  const budget = budgetOf(trip);
  const expenses = expensesOf(trip);
  const spent = expenses.reduce((s, e) => s + (+e.eur || 0), 0);
  const pct = Math.min(100, Math.round((spent / (budget || 1)) * 100));
  const over = spent > budget;
  const dt = daysTo(store.get<string | null>("tripDate", null));

  const totals: Record<string, number> = {};
  expenses.forEach((e) => (totals[e.cat] = (totals[e.cat] || 0) + (+e.eur || 0)));
  const list = mode === 0 ? expenses.filter((e) => (e.day || 0) === 0) : expenses;

  return (
    <>
      <ScreenHeader title="Budget" backHref={trip ? `/trip/${trip.id}` : "/"} />
      <div className="screen-body">
        <div className="card p-[18px]">
          <div className="flex items-center justify-between">
            <div className="tap" onClick={() => setEditBudget(true)} title="Tap to edit budget">
              <div className="dim text-[12px]">Spent so far</div>
              <div className="text-[28px] font-bold tracking-[-0.02em]">
                €{fmt(spent)}
                <span className="dim text-[14px] font-medium"> / €{fmt(budget)}</span>
              </div>
            </div>
            <span
              className="badge"
              style={{
                background: over ? "rgba(219,39,119,.16)" : "rgba(22,163,74,.16)",
                color: over ? "var(--pink)" : "var(--green)",
              }}
            >
              {over ? "Over budget" : "On track"}
            </span>
          </div>
          <div className="meter mt-3">
            <i style={{ width: pct + "%", background: over ? "var(--pink)" : undefined }} />
          </div>
          <div className="dim text-[12px] mt-2">
            {over ? `€${fmt(spent - budget)} over budget` : `€${fmt(budget - spent)} left`}
            {dt != null && dt > 0 ? ` · ${dt} days to go` : ""}
          </div>
        </div>

        <div className="seg mt-4">
          {(["Today", "Whole trip", "By category"] as const).map((l, i) => (
            <span key={l} className={mode === i ? "on" : ""} onClick={() => setMode(i as 0 | 1 | 2)}>
              {l}
            </span>
          ))}
        </div>

        {mode === 2 ? (
          <div className="mt-4">
            <div className="sec-lbl mb-2">BY CATEGORY</div>
            {Object.keys(totals).length ? (
              Object.keys(totals)
                .sort((a, b) => totals[b] - totals[a])
                .map((cat) => {
                  const w = Math.round((totals[cat] / (spent || 1)) * 100) || 0;
                  const s = CATS[cat] || CATS.Other;
                  return (
                    <div key={cat} className="mb-[14px]">
                      <div className="flex items-center justify-between mb-[6px]">
                        <div className="leg">
                          <span className="sw" style={{ background: s.c }} />
                          {cat}
                        </div>
                        <b className="text-[14px]">€{fmt(totals[cat])}</b>
                      </div>
                      <div className="meter">
                        <i style={{ width: w + "%", background: s.c }} />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="dim py-2">No expenses yet.</div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className="sec-lbl mb-[6px]">
              {mode === 0 ? "TODAY" : "WHOLE TRIP"} · €{fmt(list.reduce((s, e) => s + (+e.eur || 0), 0))}
            </div>
            {list.length ? (
              list.map((e, i) => {
                const s = CATS[e.cat] || CATS.Other;
                const gi = expenses.indexOf(e);
                return (
                  <div className="lrow" key={i}>
                    <span className="itile" style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, fontSize: 18 }}>
                      {s.e}
                    </span>
                    <div className="lt">
                      <b>{e.t}</b>
                      <span>
                        {e.cat}
                        {e.note ? " · " + e.note : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <b className="text-[14px]">€{fmt(e.eur)}</b>
                      <div
                        className="dim tap text-[10px]"
                        style={{ color: "var(--pink)" }}
                        onClick={() => {
                          const arr = [...expenses];
                          arr.splice(gi, 1);
                          setExpensesOf(trip, arr);
                        }}
                      >
                        delete
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dim py-[10px]">No expenses yet — tap + to add one.</div>
            )}
          </div>
        )}
      </div>

      <button className="fab" aria-label="Add expense" onClick={() => setAddOpen(true)}>
        <Plus size={26} color="#fff" strokeWidth={2.4} />
      </button>

      {addOpen && (
        <Sheet
          title="Add expense"
          submitLabel="Add expense"
          fields={[
            { key: "t", label: "What for", ph: "e.g. Sushi dinner" },
            { key: "eur", label: "Amount (€)", type: "number", ph: "0" },
            { key: "cat", label: "Category", type: "seg", options: Object.keys(CATS) },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (!r || !r.t || !(parseFloat(r.eur) > 0)) return;
            const arr = [...expenses];
            arr.unshift({ t: r.t, cat: r.cat, eur: parseFloat(r.eur), note: "", day: 0 });
            setExpensesOf(trip, arr);
            toast("Expense added");
          }}
        />
      )}
      {editBudget && (
        <Sheet
          title="Set total budget"
          submitLabel="Save"
          fields={[{ key: "b", label: "Budget (€)", type: "number", value: budget }]}
          onClose={(r) => {
            setEditBudget(false);
            if (r && parseFloat(r.b) > 0) {
              setBudgetOf(trip, parseFloat(r.b));
              toast("Budget updated");
            }
          }}
        />
      )}
    </>
  );
}
