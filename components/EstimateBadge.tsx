"use client";

/* Renders when meta.mock === true — keyless fallbacks stay usable but
   are always labelled (rule 4: never silent fake data). */

export default function EstimateBadge({ label = "AI estimate" }: { label?: string }) {
  return <span className="badge est">⚡ {label}</span>;
}
