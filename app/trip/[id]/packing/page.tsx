"use client";

/* Packing list — checklist by category, progress ring, add/check/delete. */

import { useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { useTrip } from "@/lib/useTrip";
import { store, useStoreVersion } from "@/lib/store";
import type { PackingGroup } from "@/lib/types";

const PACK_DEFAULT: PackingGroup[] = [
  {
    g: "Essentials",
    items: [
      { t: "Passport & visa docs", e: "📄", d: 0 },
      { t: "Universal power adapter", e: "🔌", d: 0 },
      { t: "Travel insurance card", e: "🛡️", d: 0 },
    ],
  },
  {
    g: "Clothing",
    items: [
      { t: "Comfortable walking shoes", e: "👟", d: 0 },
      { t: "Layers", e: "👕", d: 0 },
    ],
  },
  {
    g: "Tech",
    items: [
      { t: "Phone + charger", e: "📱", d: 0 },
      { t: "Portable battery", e: "🔋", d: 0 },
    ],
  },
];

export default function PackingPage() {
  const params = useParams<{ id: string }>();
  const { trip, mounted } = useTrip(params.id);
  useStoreVersion();
  const [addOpen, setAddOpen] = useState(false);

  if (!mounted) return <div className="screen-body" />;

  const data = store.get<PackingGroup[]>("packing", trip?.packing?.length ? trip.packing : PACK_DEFAULT);
  const save = (d: PackingGroup[]) => store.set("packing", d);
  let total = 0,
    done = 0;
  data.forEach((g) =>
    g.items.forEach((it) => {
      total++;
      if (it.d) done++;
    })
  );
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <ScreenHeader title={trip ? "Packing · " + trip.name.split(/[,&]/)[0].trim() : "Packing"} backHref={trip ? `/trip/${trip.id}` : "/"} />
      <div className="screen-body">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <b className="text-[15px]">
              {done} of {total} items packed
            </b>
            <div className="dim text-[12px] mt-[2px]">{pct === 100 ? "All packed — enjoy the trip ✈️" : "Keep going!"}</div>
          </div>
          <div className="ring-sm" style={{ ["--p" as any]: pct, width: 56, height: 56 }}>
            <b className="text-[12px]">{pct}%</b>
          </div>
        </div>

        {data.map((g, gi) => (
          <div key={g.g}>
            <div className="sec-lbl mt-4 mb-1">{g.g.toUpperCase()}</div>
            {g.items.map((it, ii) => (
              <div className={"check" + (it.d ? " done" : "")} key={ii}>
                <span
                  className={"cbox tap" + (it.d ? " on" : "")}
                  onClick={() => {
                    const d = JSON.parse(JSON.stringify(data)) as PackingGroup[];
                    d[gi].items[ii].d = d[gi].items[ii].d ? 0 : 1;
                    save(d);
                  }}
                >
                  {it.d ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
                </span>
                <span className="ct">{it.t}</span>
                <span className="dim text-[11px]">{it.e || ""}</span>
                <span
                  className="tap ml-[6px] text-[13px] dim"
                  onClick={() => {
                    const d = JSON.parse(JSON.stringify(data)) as PackingGroup[];
                    d[gi].items.splice(ii, 1);
                    save(d);
                  }}
                >
                  ✕
                </span>
              </div>
            ))}
          </div>
        ))}

        <button className="btn btn-primary tap mt-5" onClick={() => setAddOpen(true)}>
          Add custom item
        </button>
      </div>

      {addOpen && (
        <Sheet
          title="Add packing item"
          submitLabel="Add item"
          fields={[
            { key: "t", label: "Item", ph: "e.g. Sunglasses" },
            { key: "g", label: "Category", type: "seg", options: [...data.map((g) => g.g), "Other"] },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (!r || !r.t) return;
            const d = JSON.parse(JSON.stringify(data)) as PackingGroup[];
            let gi = d.findIndex((g) => g.g === r.g);
            if (gi < 0) {
              d.push({ g: r.g || "Other", items: [] });
              gi = d.length - 1;
            }
            d[gi].items.push({ t: r.t, e: "🧳", d: 0 });
            save(d);
            toast("Added to " + d[gi].g);
          }}
        />
      )}
    </>
  );
}
