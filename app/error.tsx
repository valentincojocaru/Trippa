"use client";

/* Branded route error boundary — a runtime error should recover gracefully
   (retry / go home) instead of showing an unstyled crash. */

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // surface for diagnostics without leaking details to the UI
    console.error(error);
  }, [error]);

  return (
    <div className="screen-body items-center justify-center text-center" style={{ minHeight: "100dvh" }}>
      <div
        className="itile"
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          fontSize: 30,
          background: "rgba(219,39,119,.1)",
          color: "var(--pink)",
        }}
        aria-hidden
      >
        ⚠️
      </div>
      <h1 className="text-[24px] mt-4">Something went wrong</h1>
      <p className="muted text-[14px] leading-[1.55] mt-2 max-w-[300px]">
        A hiccup on our side — your trips and data are safe on this device.
      </p>
      <div className="w-full flex flex-col gap-[10px] mt-6" style={{ maxWidth: 300 }}>
        <button className="btn btn-primary tap" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-ghost tap" style={{ textDecoration: "none" }}>
          Back home
        </Link>
      </div>
    </div>
  );
}
