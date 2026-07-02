"use client";

/* Currency converter — live FX (Frankfurter keyless / exchangerate
   keyed) via currencyService, multi-currency, offline cache. */

import { useCallback, useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { currencyService } from "@/lib/services/currencyService";
import { store } from "@/lib/store";
import { fmt } from "@/lib/util";

const CUR = ["EUR", "JPY", "USD", "GBP", "RON", "CHF", "THB", "AUD", "CAD", "AED", "SGD"];

export default function CurrencyPage() {
  const init = store.get("curState", { amt: "100", from: "EUR", to: "JPY" });
  const [amt, setAmt] = useState(String(init.amt));
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [rate, setRate] = useState<number | null>(null);
  const [live, setLive] = useState<boolean | null>(null);
  const [source, setSource] = useState("");

  const load = useCallback(async () => {
    const r = await currencyService.rate(from, to);
    setRate(r.data);
    setLive(!!r.meta.live);
    setSource(r.meta.source || "");
  }, [from, to]);

  useEffect(() => {
    load();
    store.set("curState", { amt, from, to });
  }, [load, amt, from, to]);

  const val = parseFloat(amt) || 0;
  const out = rate == null ? null : val * rate;

  return (
    <>
      <ScreenHeader title="Currency" backHref="/" />
      <div className="screen-body">
        <div className="card p-[18px]">
          <div className="field">
            <label>Amount</label>
            <div className="input" style={{ height: 56 }}>
              <span className="t-acc font-bold text-[16px]" style={{ width: 40 }}>
                {from}
              </span>
              <input
                inputMode="decimal"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                style={{ fontSize: 22, fontWeight: 700 }}
              />
            </div>
          </div>
          <div className="flex items-end gap-[10px] mt-[14px]">
            <div className="field flex-1">
              <label>From</label>
              <select className="tx-input" value={from} onChange={(e) => setFrom(e.target.value)}>
                {CUR.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div
              className="itile acc tap"
              style={{ width: 46, height: 46, borderRadius: 14, marginBottom: 1 }}
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
            >
              <ArrowUpDown size={20} strokeWidth={2.2} />
            </div>
            <div className="field flex-1">
              <label>To</label>
              <select className="tx-input" value={to} onChange={(e) => setTo(e.target.value)}>
                {CUR.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          className="card mt-[14px] p-5 text-center"
          style={{ background: "linear-gradient(135deg,rgba(37,99,235,.1),transparent)", borderColor: "rgba(37,99,235,.28)" }}
        >
          <div className="dim text-[12px]">Converted amount</div>
          <div className="text-[32px] font-bold tracking-[-0.02em] mt-1">
            {out == null ? "—" : fmt(out) + " " + to}
          </div>
          <div className="dim text-[12px] mt-[6px]">{rate == null ? "" : `1 ${from} = ${fmt(rate)} ${to}`}</div>
        </div>

        <div className="sec-lbl mt-5 mb-[10px]">QUICK AMOUNTS</div>
        <div className="flex flex-wrap gap-2">
          {[10, 50, 100, 500, 1000].map((v) => (
            <span key={v} className="pill tap" onClick={() => setAmt(String(v))}>
              {v}
            </span>
          ))}
        </div>

        <div className="dim text-[11px] text-center mt-[18px]">
          {live == null ? "" : live ? `Live rates · ${source}` : "Offline rates (approx.)"}
        </div>
      </div>
    </>
  );
}
