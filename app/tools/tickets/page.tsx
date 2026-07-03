"use client";

/* Tickets & passes — flights/trains/hotels as boarding-pass cards
   with deterministic barcode, route, time, gate/seat. Offline. */

import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState from "@/components/EmptyState";
import { Trash2 } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { toast } from "@/components/Toast";
import { aiService } from "@/lib/services/aiService";
import { useT } from "@/lib/i18n";
import type { Ticket } from "@/lib/types";

const TIX_KIND = [
  { k: "Flight", e: "✈️" },
  { k: "Train", e: "🚆" },
  { k: "Hotel", e: "🏨" },
  { k: "Event", e: "🎫" },
  { k: "Bus", e: "🚌" },
];

/* deterministic barcode bars from a string */
function Barcode({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffff;
  const bars: JSX.Element[] = [];
  for (let i = 0; i < 46; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + (h % 4);
    bars.push(<span key={i} style={{ width: w, ...(i % 2 ? { background: "transparent" } : {}) }} />);
  }
  return <div className="tk-bar">{bars}</div>;
}

export default function TicketsPage() {
  useStoreVersion();
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const list = store.get<Ticket[]>("tickets", []);
  const save = (d: Ticket[]) => store.set("tickets", d);

  /* AI import — paste a booking confirmation email, get tickets back.
     Extraction only: the AI copies what's in the text, never invents. */
  async function importFromText(text: string) {
    if (!text.trim()) return;
    if (!(await aiService.available())) {
      toast(t("tk.importNoKey"));
      return;
    }
    setImporting(true);
    try {
      const ask = `Extract every booking from this confirmation text. Return ONLY a minified JSON array, no backticks:
[{"kind":"Flight","from":"OTP","to":"CDG","fromName":"Bucharest","toName":"Paris","date":"2026-07-14","time":"14:25","seat":"12A","gate":"B4","ref":"ABC123"}]
kind is one of Flight/Train/Hotel/Event/Bus. Use ONLY information present in the text — leave any missing field as an empty string, never invent values. For hotels put the city in "to"/"toName" and check-in date in "date". Text:
"""${text.slice(0, 6000)}"""`;
      const raw = await aiService.complete(ask);
      const a = raw.indexOf("["),
        b = raw.lastIndexOf("]");
      let arr: any[] | null = null;
      try {
        arr = JSON.parse(raw.slice(a, b + 1));
      } catch {
        try {
          arr = JSON.parse(raw.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1"));
        } catch {}
      }
      if (!arr || !Array.isArray(arr) || !arr.length) throw new Error("parse");
      const clean: Ticket[] = arr.slice(0, 10).map((x) => ({
        kind: ["Flight", "Train", "Hotel", "Event", "Bus"].includes(x.kind) ? x.kind : "Flight",
        from: String(x.from || "").toUpperCase().slice(0, 4),
        to: String(x.to || "").toUpperCase().slice(0, 4),
        fromName: String(x.fromName || ""),
        toName: String(x.toName || ""),
        date: String(x.date || ""),
        time: String(x.time || ""),
        seat: String(x.seat || ""),
        gate: String(x.gate || ""),
        ref: String(x.ref || "").toUpperCase(),
      }));
      save([...clean, ...list]);
      toast(`${clean.length} ${t("tk.imported")}`);
      setImportOpen(false);
    } catch {
      toast(t("tk.importFail"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <ScreenHeader title="Tickets & Passes" backHref="/" />
      <div className="screen-body">
        {list.length ? (
          <div className="flex flex-col gap-4">
            {list.map((t, i) => {
              const k = TIX_KIND.find((x) => x.k === t.kind) || TIX_KIND[0];
              return (
                <div className="tk" key={i}>
                  <div className="tk-top">
                    <div className="flex items-center justify-between">
                      <span className="tk-kind">
                        {k.e} {t.kind}
                      </span>
                      <span
                        className="ic-btn tap"
                        style={{ color: "rgba(255,255,255,.7)", background: "transparent" }}
                        onClick={() => {
                          const d = [...list];
                          d.splice(i, 1);
                          save(d);
                        }}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </span>
                    </div>
                    <div className="tk-route">
                      <div>
                        <div className="tk-code">{t.from || "—"}</div>
                        <div className="tk-place">{t.fromName || ""}</div>
                      </div>
                      <div className="tk-mid">
                        <span />
                        <span className="tk-ic">{k.e}</span>
                        <span />
                      </div>
                      <div className="text-right">
                        <div className="tk-code">{t.to || "—"}</div>
                        <div className="tk-place">{t.toName || ""}</div>
                      </div>
                    </div>
                    <div className="tk-meta">
                      <div>
                        <span>Date</span>
                        <b>{t.date ? new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</b>
                      </div>
                      <div>
                        <span>Time</span>
                        <b>{t.time || "—"}</b>
                      </div>
                      <div>
                        <span>{t.kind === "Hotel" ? "Room" : "Seat"}</span>
                        <b>{t.seat || "—"}</b>
                      </div>
                      <div>
                        <span>{t.kind === "Flight" ? "Gate" : "Ref"}</span>
                        <b>{t.gate || t.ref || "—"}</b>
                      </div>
                    </div>
                  </div>
                  <div className="tk-tear">
                    <span className="tk-notch l" />
                    <span className="tk-dash" />
                    <span className="tk-notch r" />
                  </div>
                  <div className="tk-bot">
                    <Barcode seed={(t.ref || "") + (t.from || "") + (t.to || "") + i} />
                    <div className="tk-ref">{t.ref || "TRIPPA"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState emoji="🎫" text={"No tickets yet.\nAdd a flight, train or hotel booking\nto keep it handy offline."} />
        )}
        <button className="btn btn-primary tap mt-4" onClick={() => setAddOpen(true)}>
          Add ticket
        </button>
        <button className="btn btn-ghost tap mt-[10px]" disabled={importing} onClick={() => setImportOpen(true)}>
          {importing ? "✨ …" : t("tk.import")}
        </button>
      </div>

      {importOpen && (
        <Sheet
          title={t("tk.importTitle")}
          submitLabel={t("tk.importBtn")}
          fields={[{ key: "text", label: "✉️", type: "textarea", ph: t("tk.importPh") }]}
          onClose={(r) => {
            if (!r) {
              setImportOpen(false);
              return;
            }
            importFromText(r.text || "");
          }}
        />
      )}

      {addOpen && (
        <Sheet
          title="Add ticket"
          submitLabel="Save"
          fields={[
            { key: "kind", label: "Type", type: "seg", options: TIX_KIND.map((x) => x.k) },
            { key: "from", label: "From (code)", ph: "e.g. OTP" },
            { key: "to", label: "To (code)", ph: "e.g. CDG" },
            { key: "date", label: "Date (YYYY-MM-DD)", ph: "2026-07-14" },
            { key: "time", label: "Time", ph: "e.g. 14:25" },
            { key: "seat", label: "Seat / Room", ph: "optional" },
            { key: "gate", label: "Gate", ph: "optional" },
            { key: "ref", label: "Booking ref", ph: "optional" },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (r && r.kind) {
              save([
                {
                  kind: r.kind || "Flight",
                  from: (r.from || "").toUpperCase(),
                  to: (r.to || "").toUpperCase(),
                  date: r.date || "",
                  time: r.time || "",
                  seat: r.seat || "",
                  gate: r.gate || "",
                  ref: (r.ref || "").toUpperCase(),
                },
                ...list,
              ]);
              toast("Ticket added");
            }
          }}
        />
      )}
    </>
  );
}
