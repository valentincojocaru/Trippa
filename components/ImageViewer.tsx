"use client";

/* Full-screen image viewer — shared by the journal and wallet. Portals to
   <body> so it's never trapped in a page stacking context; closes on
   backdrop click, the close button, or Escape; announced as a dialog. */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ImageViewer({
  src,
  alt = "",
  onClose,
}: {
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {src && (
        <motion.div
          className="img-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={src}
            alt={alt}
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          />
          <button className="iv-close" onClick={onClose} aria-label="Close preview">
            <X size={18} strokeWidth={2.4} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
