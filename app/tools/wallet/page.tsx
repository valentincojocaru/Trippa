"use client";

/* Travel Wallet — passport/visa/insurance/ID docs with photo and
   expiry status (green/amber/red). Offline, on-device only. */

import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import EmptyState from "@/components/EmptyState";
import { Camera, Trash2 } from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { pickPhoto } from "@/lib/photo";
import { toast } from "@/components/Toast";
import type { WalletDoc } from "@/lib/types";

const DOC_TYPES = [
  { k: "Passport", e: "🛂" },
  { k: "Visa", e: "📄" },
  { k: "Insurance", e: "🛡️" },
  { k: "ID card", e: "🪪" },
  { k: "Vaccine", e: "💉" },
  { k: "Other", e: "📎" },
];

function expiryInfo(d: WalletDoc) {
  if (!d.expiry) return null;
  const days = Math.ceil((new Date(d.expiry).getTime() - Date.now()) / 86400e3);
  if (days < 0) return { txt: "Expired", c: "#C2456B" };
  if (days <= 30) return { txt: `Expires in ${days}d`, c: "#B6831C" };
  if (days <= 180) return { txt: `Expires in ${Math.round(days / 30)} mo`, c: "var(--text-2)" };
  return {
    txt: `Valid · ${new Date(d.expiry).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`,
    c: "var(--green)",
  };
}

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useStoreVersion();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const docs = store.get<WalletDoc[]>("wallet_docs", []);
  const save = (d: WalletDoc[]) => store.set("wallet_docs", d);

  if (!mounted) return <div className="screen-body" />;

  return (
    <>
      <ScreenHeader title="Travel Wallet" backHref="/" />
      <div className="screen-body">
        <div className="card p-[13px] flex gap-[11px] items-center mb-4">
          <span className="itile glass2" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 18 }}>
            🔒
          </span>
          <div className="flex-1 text-[12.5px] leading-[1.4]" style={{ color: "var(--text-2)" }}>
            Stored only on this device, available offline. Nothing is uploaded.
          </div>
        </div>

        {docs.length ? (
          <div className="flex flex-col gap-3">
            {docs.map((d, i) => {
              const t = DOC_TYPES.find((x) => x.k === d.type) || DOC_TYPES[5];
              const ex = expiryInfo(d);
              return (
                <div className="card overflow-hidden" style={{ padding: 0 }} key={i}>
                  {d.img && (
                    <div className="wl-thumb tap" style={{ backgroundImage: `url('${d.img}')` }} onClick={() => setView(d.img!)} />
                  )}
                  <div className="p-[13px] flex gap-3 items-center">
                    <span className="itile glass2" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 20 }}>
                      {t.e}
                    </span>
                    <div className="flex-1">
                      <b className="text-[14.5px]">{d.label || d.type}</b>
                      <div className="text-[12px] mt-[2px]" style={{ color: ex ? ex.c : "var(--text-3)" }}>
                        {ex ? ex.txt : d.number ? "•••• " + d.number.slice(-4) : "No expiry"}
                      </div>
                    </div>
                    {!d.img && (
                      <span
                        className="ic-btn tap"
                        title="add photo"
                        onClick={async () => {
                          const img = await pickPhoto();
                          if (img) {
                            const arr = [...docs];
                            arr[i] = { ...arr[i], img };
                            save(arr);
                          }
                        }}
                      >
                        <Camera size={16} strokeWidth={2} />
                      </span>
                    )}
                    <span
                      className="ic-btn tap"
                      style={{ color: "#C2456B" }}
                      onClick={() => {
                        const arr = [...docs];
                        arr.splice(i, 1);
                        save(arr);
                      }}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState emoji="🛂" text={"No documents yet.\nAdd your passport, visa or insurance\nfor safe offline access."} />
        )}

        <button className="btn btn-primary tap mt-4" onClick={() => setAddOpen(true)}>
          Add document
        </button>
      </div>

      {addOpen && (
        <Sheet
          title="Add document"
          submitLabel="Save"
          fields={[
            { key: "type", label: "Type", type: "seg", options: DOC_TYPES.map((t) => t.k) },
            { key: "label", label: "Label", ph: "e.g. My passport" },
            { key: "number", label: "Document number", ph: "optional" },
            { key: "expiry", label: "Expiry (YYYY-MM-DD)", ph: "2030-05-01" },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (r && r.type) {
              save([{ type: r.type, label: r.label, number: r.number || "", expiry: r.expiry || "", img: "" }, ...docs]);
              toast("Document saved");
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
