"use client";

/* Favorites — saved places wishlist (port of features2.js buildFavs). */

import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState from "@/components/EmptyState";
import { MapPin, Trash2 } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { toast } from "@/components/Toast";
import type { Favorite } from "@/lib/types";

export default function FavoritesPage() {
  useStoreVersion();
  const [addOpen, setAddOpen] = useState(false);
  const data = store.get<Favorite[]>("favs", []);
  const save = (d: Favorite[]) => store.set("favs", d);

  return (
    <>
      <ScreenHeader title="Saved Places" backHref="/" />
      <div className="screen-body">
        <button className="btn btn-primary tap mb-4" onClick={() => setAddOpen(true)}>
          Save a place
        </button>
        {data.length ? (
          <div className="flex flex-col gap-[11px]">
            {data.map((f, i) => (
              <div className="card p-[13px] flex gap-3 items-center" key={i}>
                <span className="itile" style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <MapPin size={20} strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <b className="text-[14px]">{f.name}</b>
                  <div className="dim text-[12px]">
                    {f.city} · {f.tag}
                  </div>
                </div>
                <span
                  className="ic-btn tap"
                  style={{ color: "#C2456B" }}
                  onClick={() => {
                    const d = [...data];
                    d.splice(i, 1);
                    save(d);
                  }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState emoji="📍" text={"No saved places yet.\nTap “Save a place” to start your wishlist."} />
        )}
      </div>

      {addOpen && (
        <Sheet
          title="Save a place"
          submitLabel="Save"
          fields={[
            { key: "name", label: "Place", ph: "e.g. Time Out Market" },
            { key: "city", label: "City", ph: "e.g. Lisbon" },
            { key: "tag", label: "Type", type: "seg", options: ["Food", "Sights", "View", "Shopping", "Neighborhood"] },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (r && r.name) {
              save([{ name: r.name, city: r.city || "", tag: r.tag }, ...data]);
              toast("Saved");
            }
          }}
        />
      )}
    </>
  );
}
