"use client";

/* Destination image tile — always a REAL photo of the place
   (curated Unsplash or the city's Wikipedia photo); shows a
   flag-gradient tile only while loading or offline. */

import { useDestPhoto, flagTileGradient } from "@/lib/destPhoto";
import type { Place } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

export default function DestImage({
  d,
  size = 300,
  className,
  style,
  children,
}: {
  d: Place;
  size?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const url = useDestPhoto(d, size);
  return (
    <div
      className={className}
      style={{
        ...style,
        ...(url
          ? { backgroundImage: `url('${url}')`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: flagTileGradient(d), display: "flex", alignItems: "center", justifyContent: "center" }),
      }}
    >
      {!url && <span style={{ fontSize: 26, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))" }}>{d.flag}</span>}
      {children}
    </div>
  );
}
