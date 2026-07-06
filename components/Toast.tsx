"use client";

/* Imperative toast. A Framer spring pops it up from the tab bar and eases it
   away, matching the motion language of the bottom sheet. */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

let push: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  push?.(msg);
}

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    push = (m: string) => {
      setMsg(m);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2000);
    };
    return () => {
      push = null;
      clearTimeout(t);
    };
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          className="tx-toast fmot"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: "-50%", y: 16, scale: 0.94 }}
          animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
          exit={{ opacity: 0, x: "-50%", y: 10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 460, damping: 30 }}
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
