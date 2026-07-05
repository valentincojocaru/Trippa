"use client";

/* Reusable empty state — every data view has a real empty state
   when no trip exists (rule 3: no hardcoded destinations). */

import { useRouter } from "next/navigation";

export default function EmptyState({
  emoji,
  text,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  onSecondary,
}: {
  emoji: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="card p-[30px] text-center flex flex-col items-center">
      <div
        className="itile acc mb-3"
        style={{ width: 64, height: 64, borderRadius: 22, fontSize: 28 }}
        aria-hidden
      >
        {emoji}
      </div>
      <div className="muted text-[13px] leading-[1.55] whitespace-pre-line max-w-[280px]">{text}</div>
      {ctaLabel && ctaHref && (
        <button className="btn btn-primary tap mt-4" onClick={() => router.push(ctaHref)}>
          {ctaLabel}
        </button>
      )}
      {secondaryLabel && (
        <button className="btn btn-ghost tap mt-[10px]" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
