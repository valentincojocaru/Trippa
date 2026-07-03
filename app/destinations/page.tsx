/* Public index of all curated destinations — statically rendered
   for SEO, grouped by vibe. Every card deep-links into the planner. */

import type { Metadata } from "next";
import Link from "next/link";
import { allDestinations, categories } from "@/data/destinations";

export const metadata: Metadata = {
  title: "352 destinations to plan with AI | Trippa",
  description:
    "Beaches, city breaks, mountains, islands and ski resorts across every continent — pick a destination and let Trippa's AI plan the whole trip: flights, hotels, itinerary and budget.",
  alternates: { canonical: "/destinations" },
};

const slugOf = (city: string) =>
  city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function DestinationsIndex() {
  return (
    <div className="screen-body" style={{ paddingBottom: 120 }}>
      <h1 className="text-[26px] mt-2">Where to next?</h1>
      <p className="muted text-[14px] mt-2 leading-[1.5]">
        {allDestinations.length} destinations across every continent. Pick one — Trippa&apos;s AI
        plans the flights, stays, itinerary and budget.
      </p>

      {categories.map((c) => {
        const list = allDestinations.filter((d) => d.tags.includes(c.key)).slice(0, 12);
        if (!list.length) return null;
        return (
          <div key={c.key}>
            <div className="rs-sec">{c.label}</div>
            <div className="flex flex-wrap gap-2">
              {list.map((d) => (
                <Link
                  key={d.city}
                  href={`/destinations/${slugOf(d.city)}`}
                  className="pill tap"
                  style={{ textDecoration: "none", height: 38 }}
                >
                  {d.flag} {d.city}
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rs-sec">A–Z</div>
      <div className="flex flex-wrap gap-2">
        {[...allDestinations]
          .sort((a, b) => a.city.localeCompare(b.city))
          .map((d) => (
            <Link
              key={d.city}
              href={`/destinations/${slugOf(d.city)}`}
              className="pill tap"
              style={{ textDecoration: "none", height: 34 }}
            >
              {d.flag} {d.city}
            </Link>
          ))}
      </div>
    </div>
  );
}
