"use client";

/* Time zones — home vs destination live clocks + difference
   (port of features2.js buildClock). Driven by the active trip. */

import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { useTrip } from "@/lib/useTrip";

const homeTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Europe/London";
  }
};
const tzCity = (tz: string) => (tz || "").split("/").pop()?.replace(/_/g, " ") || "Home";

export default function TimezonesPage() {
  const { trip, mounted } = useTrip("active");
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!mounted) return <div className="screen-body" />;

  const destTz = trip && trip.tz && trip.tz !== "auto" ? trip.tz : null;
  const destCity = trip ? (trip.name || "Destination").split(/[&,]/)[0].trim() : "Destination";
  const hTz = homeTz();
  const zones = [
    ...(destTz ? [{ city: destCity, tz: destTz, label: "Destination" }] : []),
    { city: tzCity(hTz), tz: hTz, label: "Home" },
  ];

  let diffHtml: string | null = null;
  if (destTz) {
    const d = new Date();
    const a = new Date(d.toLocaleString("en-US", { timeZone: destTz }));
    const b = new Date(d.toLocaleString("en-US", { timeZone: hTz }));
    const diff = Math.round((a.getTime() - b.getTime()) / 3600e3);
    diffHtml =
      diff === 0
        ? `${destCity} is in the same time zone as home.`
        : `${destCity} is ${Math.abs(diff)}h ${diff > 0 ? "ahead of" : "behind"} home.`;
  }

  return (
    <>
      <ScreenHeader title="Time Zones" backHref="/" />
      <div className="screen-body">
        <div className="flex flex-col gap-[13px]">
          {zones.map((z) => {
            const now = new Date();
            const tm = now.toLocaleTimeString("en-GB", { timeZone: z.tz, hour: "2-digit", minute: "2-digit" });
            const day = now.toLocaleDateString("en-US", { timeZone: z.tz, weekday: "short", month: "short", day: "numeric" });
            const h = +now.toLocaleTimeString("en-GB", { timeZone: z.tz, hour: "2-digit", hour12: false }).slice(0, 2);
            const night = h < 7 || h >= 20;
            return (
              <div className="card p-4 flex justify-between items-center" key={z.label}>
                <div>
                  <div className="dim text-[11px] tracking-[0.1em]">{z.label.toUpperCase()}</div>
                  <b className="text-[16px]">{z.city}</b>
                  <div className="dim text-[12px] mt-[1px]">{day}</div>
                </div>
                <div className="text-right">
                  <div className="text-[34px] font-extrabold tracking-[-0.02em] tabular-nums">{tm}</div>
                  <div className="dim text-[12px]">{night ? "🌙 night" : "☀️ day"}</div>
                </div>
              </div>
            );
          })}
        </div>
        {diffHtml ? (
          <div className="card mt-4 p-[14px] flex gap-[11px] items-center">
            <span className="itile glass2" style={{ width: 34, height: 34, borderRadius: 10, fontSize: 16 }}>
              🕑
            </span>
            <div className="flex-1 text-[12.5px] leading-[1.4]">{diffHtml}</div>
          </div>
        ) : (
          <div className="card mt-4 p-[18px] text-center">
            <div className="muted text-[13px]">
              Plan a trip and you’ll see the local time at your destination next to home time.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
