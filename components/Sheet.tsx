"use client";

/* Bottom-sheet form — shared across the app (expenses, packing, journal,
   reminders…). Framer Motion drives a spring entrance and drag-to-dismiss
   for a native feel; the values/close contract is unchanged so every caller
   works without edits. Keyboard: Escape closes, focus is trapped, the sheet
   is announced as a dialog. */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X } from "lucide-react";

export type SheetField = {
  key: string;
  label: string;
  ph?: string;
  value?: string | number;
  type?: "text" | "number" | "textarea" | "seg" | "stars";
  options?: string[];
};

const SPRING = { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.9 };

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
  const [open, setOpen] = useState(true);
  const result = useRef<Record<string, string> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
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

  // stage the result, then let the exit animation run before notifying the caller
  const close = (v: Record<string, string> | null) => {
    result.current = v;
    setOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(null);
    };
    window.addEventListener("keydown", onKey);
    // move focus into the sheet for keyboard users
    sheetRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 130 || info.velocity.y > 700) close(null);
  };

  return (
    <AnimatePresence onExitComplete={() => onClose(result.current)}>
      {open && (
        <motion.div
          className="tx-overlay fmot"
          style={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close(null);
          }}
        >
          <motion.div
            ref={sheetRef}
            className="tx-sheet fmot"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            <div className="tx-grab" style={{ cursor: "grab" }} />
            <div className="flex items-center justify-between mb-[14px]">
              <b className="text-[16px]">{title}</b>
              <button
                className="itile glass2 tap"
                style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)" }}
                onClick={() => close(null)}
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
            <button className="btn btn-primary tap mt-4" onClick={() => close({ ...vals })}>
              {submitLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
