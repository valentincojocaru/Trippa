"use client";

/* Split expenses — group members, who paid, greedy settle-up
   (port of features2.js buildSplit). */

import { useState } from "react";
import { useParams } from "next/navigation";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { useTrip } from "@/lib/useTrip";
import { store, useStoreVersion } from "@/lib/store";
import { fmt } from "@/lib/util";

type SplitData = { people: string[]; bills: { t: string; payer: string; amount: number }[] };
const SPLIT_DEFAULT: SplitData = { people: ["You"], bills: [] };

function settle(d: SplitData) {
  const n = d.people.length || 1;
  const total = d.bills.reduce((s, b) => s + (+b.amount || 0), 0);
  const share = total / n;
  const paid: Record<string, number> = {};
  d.people.forEach((p) => (paid[p] = 0));
  d.bills.forEach((b) => (paid[b.payer] = (paid[b.payer] || 0) + (+b.amount || 0)));
  const bal = d.people.map((p) => ({ p, net: +((paid[p] || 0) - share).toFixed(2) }));
  const debtors = bal.filter((b) => b.net < -0.01).map((b) => ({ ...b })).sort((a, b) => a.net - b.net);
  const creditors = bal.filter((b) => b.net > 0.01).map((b) => ({ ...b })).sort((a, b) => b.net - a.net);
  const tx: { from: string; to: string; amt: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(-debtors[i].net, creditors[j].net);
    if (amt > 0.01) tx.push({ from: debtors[i].p, to: creditors[j].p, amt: +amt.toFixed(2) });
    debtors[i].net += amt;
    creditors[j].net -= amt;
    if (Math.abs(debtors[i].net) < 0.01) i++;
    if (creditors[j].net < 0.01) j++;
  }
  return { total, share, bal, tx };
}

export default function SplitPage() {
  const params = useParams<{ id: string }>();
  const { trip, mounted } = useTrip(params.id);
  useStoreVersion();
  const [sheet, setSheet] = useState<"bill" | "person" | null>(null);

  if (!mounted) return <div className="screen-body" />;
  const d = store.get<SplitData>("split", SPLIT_DEFAULT);
  const s = settle(d);
  const save = (v: SplitData) => store.set("split", v);

  return (
    <>
      <ScreenHeader title="Split" backHref={trip ? `/trip/active` : "/"} />
      <div className="screen-body">
        <div className="card p-[14px]">
          <div className="dim text-[12px]">Trip total · {d.people.length} people</div>
          <div className="text-[30px] font-extrabold tracking-[-0.02em] mt-[2px]">€{fmt(s.total)}</div>
          <div className="dim text-[12.5px] mt-[2px]">€{fmt(s.share)} each</div>
        </div>

        <div className="sec-lbl mt-[18px] mb-2">WHO OWES WHOM</div>
        {s.tx.length ? (
          s.tx.map((t, i) => (
            <div className="lrow" key={i}>
              <span className="av-sm">{t.from[0]}</span>
              <div className="lt">
                <b>
                  {t.from} → {t.to}
                </b>
                <span>settles up</span>
              </div>
              <b className="text-[14px]" style={{ color: "#C2456B" }}>
                €{fmt(t.amt)}
              </b>
            </div>
          ))
        ) : (
          <div className="card p-4 text-center">
            <b style={{ color: "var(--green)" }}>All settled up ✓</b>
          </div>
        )}

        <div className="sec-lbl mt-[18px] mb-2">BALANCES</div>
        {s.bal.map((b) => (
          <div className="flex items-center justify-between py-[9px]" style={{ borderBottom: "1px solid var(--border)" }} key={b.p}>
            <div className="leg">
              <span className="av-sm">{b.p[0]}</span>
              {b.p}
            </div>
            <b className="text-[13.5px]" style={{ color: b.net >= 0 ? "var(--green)" : "#C2456B" }}>
              {b.net >= 0 ? "+" : ""}€{fmt(Math.abs(b.net))}
            </b>
          </div>
        ))}

        <div className="sec-lbl mt-[18px] mb-2">EXPENSES</div>
        {[...d.bills].reverse().map((b) => {
          const gi = d.bills.indexOf(b);
          return (
            <div className="lrow" key={gi}>
              <span className="av-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                {b.payer[0]}
              </span>
              <div className="lt">
                <b>{b.t}</b>
                <span>{b.payer} paid</span>
              </div>
              <div className="text-right">
                <b className="text-[14px]">€{fmt(b.amount)}</b>
                <div
                  className="dim tap text-[10px]"
                  style={{ color: "#C2456B" }}
                  onClick={() => {
                    const v = { ...d, bills: [...d.bills] };
                    v.bills.splice(gi, 1);
                    save(v);
                  }}
                >
                  remove
                </div>
              </div>
            </div>
          );
        })}

        <button className="btn btn-primary tap mt-4" onClick={() => setSheet("bill")}>
          Add shared expense
        </button>
        <button className="btn-ghost-sm tap" onClick={() => setSheet("person")}>
          Add person
        </button>
      </div>

      {sheet === "bill" && (
        <Sheet
          title="Shared expense"
          submitLabel="Add"
          fields={[
            { key: "t", label: "What for", ph: "e.g. Taxi" },
            { key: "amount", label: "Amount (€)", type: "number", ph: "0" },
            { key: "payer", label: "Paid by", type: "seg", options: d.people },
          ]}
          onClose={(r) => {
            setSheet(null);
            if (r && r.t && +r.amount > 0) {
              save({ ...d, bills: [...d.bills, { t: r.t, payer: r.payer, amount: +r.amount }] });
              toast("Expense added");
            }
          }}
        />
      )}
      {sheet === "person" && (
        <Sheet
          title="Add person"
          submitLabel="Add"
          fields={[{ key: "name", label: "Name", ph: "e.g. Maria" }]}
          onClose={(r) => {
            setSheet(null);
            if (r && r.name) save({ ...d, people: [...d.people, r.name] });
          }}
        />
      )}
    </>
  );
}
