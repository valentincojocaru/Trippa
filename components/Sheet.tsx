"use client";

/* Bottom-sheet form — port of the reference `sheet()` helper.
   Renders a set of fields and resolves with the values on submit. */

import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
  const [on, setOn] = useState(false);
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

  useEffect(() => {
    requestAnimationFrame(() => setOn(true));
  }, []);

  const close = (v: Record<string, string> | null) => {
    setOn(false);
    setTimeout(() => onClose(v), 200);
  };

  return (
    <div
      className={"tx-overlay" + (on ? " on" : "")}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(null);
      }}
    >
      <div className="tx-sheet">
        <div className="flex items-center justify-between mb-[14px]">
          <b className="text-[16px]">{title}</b>
          <div
            className="itile glass2 tap"
            style={{ width: 32, height: 32, borderRadius: 10 }}
            onClick={() => close(null)}
          >
            <X size={15} strokeWidth={2.4} />
          </div>
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
        <button className="btn btn-primary tap mt-4" onClick={() => close({ ...vals })}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
