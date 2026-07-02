"use client";

/* Trip photo block — the trip's own hero when it has one, otherwise a
   REAL photo of that trip's destination (Wikipedia), never a stock
   photo of a different place. */

import { usePlacePhoto } from "@/lib/destPhoto";
import type { CSSProperties, ReactNode } from "react";

export default function TripImage({
  name,
  country = "",
  hero,
  className,
  style,
  children,
  onClick,
}: {
  name: string;
  country?: string;
  hero?: string | null;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
}) {
  const city = (name || "").split(/[,&]/)[0].trim();
  const resolved = usePlacePhoto(hero ? "" : city, country, undefined, 600);
  const url = hero || resolved;
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: "#2a3550",
        ...style,
        ...(url ? { backgroundImage: `url('${url}')`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
      }}
    >
      {children}
    </div>
  );
}
