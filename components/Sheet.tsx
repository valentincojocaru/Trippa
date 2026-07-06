"use client";

/* Bottom-sheet form — shared across the app (expenses, packing, journal,
   reminders…). Built on SheetShell, so it inherits the spring entrance,
   drag-to-dismiss, Escape and dialog semantics. The values/close contract
   is unchanged: onClose receives the field values on submit, or null on
   dismiss, so every caller works without edits. */

import { useRef, useState } from "react";
import { X } from "lucide-react";
import SheetShell from "@/components/SheetShell";

export type SheetField = {
  key: string;
  label: string;
  ph?: string;
  value?: string | number;
  type?: "text" | "number" | "textarea" | "seg" | "stars";
  options?: string[];
};

export default function Sheet({
  title,
  fields,
  submitLabel = "Add",
  onClose,
}: {
  title: string;
  fields: SheetField[];
  submitLabel?: string;
  onClose: (values: Record<string, string> | null) => void;
}) {
  const result = useRef<Record<string, string> | null>(null);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    fields.forEach((f) => {
      v[f.key] =
        f.type === "seg"
          ? String(f.value ?? f.options?.[0] ?? "")
          : f.type === "stars"
            ? String(f.value ?? 5)
            : String(f.value ?? "");
    });
    return v;
  });

  return (
    <SheetShell ariaLabel={title} onClose={() => onClose(result.current)}>
      {(close) => (
        <>
          <div className="flex items-center justify-between mb-[14px]">
            <b className="text-[16px]">{title}</b>
            <button
              className="itile glass2 tap"
              style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)" }}
              onClick={close}
              aria-label="Close"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>
          <div className="flex flex-col gap-[13px]">
            {fields.map((f) => (
              <div className="field" key={f.key}>
                <label>{f.label}</label>
                {f.type === "seg" ? (
                  <div className="seg">
                    {(f.options || []).map((o) => (
                      <span
                        key={o}
                        className={vals[f.key] === o ? "on" : ""}
                        onClick={() => setVals((v) => ({ ...v, [f.key]: o }))}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                ) : f.type === "stars" ? (
                  <div className="flex gap-[6px]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={"tx-star" + (i <= Number(vals[f.key]) ? " on" : "")}
                        onClick={() => setVals((v) => ({ ...v, [f.key]: String(i) }))}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                ) : f.type === "textarea" ? (
                  <textarea
                    className="tx-input"
                    placeholder={f.ph || ""}
                    value={vals[f.key]}
                    onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="tx-input"
                    inputMode={f.type === "number" ? "decimal" : undefined}
                    placeholder={f.ph || ""}
                    value={vals[f.key]}
                    onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary tap mt-4"
            onClick={() => {
              result.current = { ...vals };
              close();
            }}
          >
            {submitLabel}
          </button>
        </>
      )}
    </SheetShell>
  );
}
