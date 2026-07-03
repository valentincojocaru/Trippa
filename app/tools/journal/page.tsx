"use client";

/* Trip Journal — dated note + photo entries, timeline. Offline,
   photos stored as downscaled dataURLs (port of features4.js). */

import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState from "@/components/EmptyState";
import { Camera } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { pickPhoto } from "@/lib/photo";
import { toast } from "@/components/Toast";
import type { JournalEntry } from "@/lib/types";

export default function JournalPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useStoreVersion();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const list = [...store.get<JournalEntry[]>("journal", [])].sort((a, b) => b.t - a.t);
  const save = (d: JournalEntry[]) => store.set("journal", d);

  if (!mounted) return <div className="screen-body" />;

  return (
    <>
      <ScreenHeader title="Trip Journal" backHref="/" />
      <div className="screen-body">
        <button className="btn btn-primary tap mb-4" onClick={() => setAddOpen(true)}>
          New entry
        </button>

        {list.length ? (
          <div className="flex flex-col">
            {list.map((e) => (
              <div className="jr-item" key={e.id}>
                <div className="jr-rail">
                  <span className="jr-dot" />
                </div>
                <div className="jr-card">
                  <div className="dim text-[11px] tracking-[0.04em]">
                    {new Date(e.t).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                    {e.place ? " · " + e.place : ""}
                  </div>
                  {e.title && <b className="text-[15px] block mt-[3px]">{e.title}</b>}
                  {e.img && <div className="jr-img tap" style={{ backgroundImage: `url('${e.img}')` }} onClick={() => setView(e.img)} />}
                  {e.note && (
                    <div className="text-[13px] leading-[1.5] mt-2 whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>
                      {e.note}
                    </div>
                  )}
                  <div className="flex items-center gap-[10px] mt-[10px]">
                    {!e.img && (
                      <span
                        className="jr-act tap"
                        onClick={async () => {
                          const img = await pickPhoto();
                          if (img) {
                            const d = store.get<JournalEntry[]>("journal", []);
                            const it = d.find((x) => x.id === e.id);
                            if (it) {
                              it.img = img;
                              save(d);
                            }
                          }
                        }}
                      >
                        <Camera size={14} strokeWidth={2} /> Photo
                      </span>
                    )}
                    <span
                      className="jr-act tap"
                      style={{ color: "#C2456B" }}
                      onClick={() => save(store.get<JournalEntry[]>("journal", []).filter((x) => x.id !== e.id))}
                    >
                      Delete
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState emoji="📔" text={"Your journal is empty.\nCapture a moment from your trip —\nit becomes a memory you keep."} />
        )}
      </div>

      {addOpen && (
        <Sheet
          title="New journal entry"
          submitLabel="Save"
          fields={[
            { key: "title", label: "Title", ph: "e.g. Sunset at the harbour" },
            { key: "place", label: "Place", ph: "optional" },
            { key: "note", label: "Note", type: "textarea", ph: "What happened today?" },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (r && (r.title || r.note)) {
              const d = store.get<JournalEntry[]>("journal", []);
              d.push({ id: "j" + Date.now(), t: Date.now(), title: r.title || "", place: r.place || "", note: r.note || "", img: "" });
              save(d);
              toast("Saved to journal");
            }
          }}
        />
      )}

      {view && (
        <div className="img-viewer" onClick={() => setView(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={view} alt="" />
          <span className="iv-close">✕</span>
        </div>
      )}
    </>
  );
}
