"use client";

/* SheetShell — the one bottom-sheet primitive. Owns the animated scrim, the
   draggable spring sheet, grab handle, backdrop/Escape/drag dismissal, focus
   and dialog semantics. Children render inside via a render-prop that receives
   an imperative `close()` so buttons (submit, actions) can dismiss with the
   exit animation intact. `onClose` fires once, after the exit completes. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.9 };

export default function SheetShell({
  ariaLabel,
  dismissible = true,
  onClose,
  children,
}: {
  ariaLabel: string;
  dismissible?: boolean;
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) close();
    };
    window.addEventListener("keydown", onKey);
    sheetRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (dismissible && (info.offset.y > 130 || info.velocity.y > 700)) close();
  };

  // portal to <body> so the fixed overlay escapes any page-level stacking
  // context (the floating tab bar must never sit above a sheet)
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {open && (
        <motion.div
          className="tx-overlay fmot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && dismissible) close();
          }}
        >
          <motion.div
            ref={sheetRef}
            className="tx-sheet fmot"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            drag={dismissible ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            <div className="tx-grab" style={{ cursor: dismissible ? "grab" : "default" }} />
            {children(close)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
