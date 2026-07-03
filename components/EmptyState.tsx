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
    <div className="card p-[30px] text-center">
      <div className="text-[30px] mb-2">{emoji}</div>
      <div className="muted text-[13px] leading-[1.5] whitespace-pre-line">{text}</div>
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
