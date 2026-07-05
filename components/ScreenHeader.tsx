"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function ScreenHeader({
  title,
  right,
  backHref,
}: {
  title: string;
  right?: ReactNode;
  backHref?: string;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-5 pt-4">
      <button
        className="itile glass tap"
        style={{ width: 38, height: 38, borderRadius: 12, color: "var(--text)" }}
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        aria-label="Back"
      >
        <ChevronLeft size={19} strokeWidth={2.2} />
      </button>
      <b className="text-[15px]">{title}</b>
      <div className="flex justify-end" style={{ minWidth: 38 }}>
        {right || <span style={{ width: 38 }} />}
      </div>
    </div>
  );
}
