"use client";

/* Pre-departure checklist (port of features2.js buildPrep). */

import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import { Check, Plus } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { daysTo } from "@/lib/util";

type PrepItem = { t: string; due: string; d: number };
const PREP_DEFAULT: PrepItem[] = [
  { t: "Check passport valid 6+ months", due: "ASAP", d: 0 },
  { t: "Visa / entry requirements check", due: "4 wks before", d: 0 },
  { t: "Travel insurance", due: "3 wks before", d: 0 },
  { t: "Book airport transfer", due: "2 wks before", d: 0 },
  { t: "Activate roaming / eSIM", due: "1 wk before", d: 0 },
  { t: "Notify bank of travel", due: "1 wk before", d: 0 },
  { t: "Download offline maps", due: "2 days before", d: 0 },
  { t: "Check-in online", due: "24h before", d: 0 },
];

export default function PrepPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useStoreVersion();
  const [addOpen, setAddOpen] = useState(false);
  const data = store.get<PrepItem[]>("prep", PREP_DEFAULT);
  const save = (d: PrepItem[]) => store.set("prep", d);
  const done = data.filter((x) => x.d).length;
  const pct = data.length ? Math.round((done / data.length) * 100) : 0;
  const dt = daysTo(store.get<string | null>("tripDate", null));

  if (!mounted) return <div className="screen-body" />;

  return (
    <>
      <ScreenHeader title="Before You Go" backHref="/" />
      <div className="screen-body">
        <div className="card p-[14px] flex items-center justify-between">
          <div>
            <b className="text-[15px]">
              {done}/{data.length} done
            </b>
            <div className="dim text-[12px] mt-[2px]">
              {dt != null ? dt + " days until departure" : "Plan a trip to get a countdown"}
            </div>
          </div>
          <div className="ring-sm" style={{ ["--p" as any]: pct, width: 50, height: 50 }}>
            <b className="text-[12px]">{pct}%</b>
          </div>
        </div>

        <div className="mt-[14px]">
          {data.map((x, i) => (
            <div className={"check" + (x.d ? " done" : "")} key={i}>
              <span
                className={"cbox tap" + (x.d ? " on" : "")}
                onClick={() => {
                  const d = [...data];
                  d[i] = { ...d[i], d: d[i].d ? 0 : 1 };
                  save(d);
                }}
              >
                {x.d ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
              </span>
              <div className="flex-1">
                <div className="ct">{x.t}</div>
                <div className="dim text-[11px]">{x.due}</div>
              </div>
              <span
                className="tap dim text-[13px]"
                onClick={() => {
                  const d = [...data];
                  d.splice(i, 1);
                  save(d);
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
        <button className="btn-ghost-sm tap" onClick={() => setAddOpen(true)}>
          <Plus size={15} strokeWidth={2.2} />
          Add task
        </button>
      </div>

      {addOpen && (
        <Sheet
          title="Add task"
          submitLabel="Add"
          fields={[
            { key: "t", label: "Task", ph: "e.g. Buy adapter" },
            { key: "due", label: "When", ph: "1 wk before" },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (r && r.t) save([...data, { t: r.t, due: r.due || "", d: 0 }]);
          }}
        />
      )}
    </>
  );
}
