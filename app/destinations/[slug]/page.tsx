/* ============================================================
   Public destination pages — server-rendered & statically
   generated for all 352 curated destinations, so Google can
   index "Travel to Lisbon" etc. and funnel organic traffic into
   the AI planner. No client JS needed for the content itself.
   ============================================================ */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allDestinations, photoURL } from "@/data/destinations";
import { COUNTRY } from "@/data/countries";

export const dynamicParams = false;

const slugOf = (city: string) =>
  city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const bySlug = (slug: string) => allDestinations.find((d) => slugOf(d.city) === slug);

export function generateStaticParams() {
  return allDestinations.map((d) => ({ slug: slugOf(d.city) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const d = bySlug(params.slug);
  if (!d) return {};
  return {
    title: `${d.city}, ${d.country} — plan your trip with AI | Trippa`,
    description: `Plan a complete ${d.city} trip in seconds: flights, hotels, day-by-day itinerary, budget and packing — built by Trippa's AI travel concierge.`,
    alternates: { canonical: `/destinations/${params.slug}` },
    openGraph: {
      title: `${d.city}, ${d.country} — Trippa`,
      description: `AI-planned trips to ${d.city}: flights, stays, itinerary and budget in one tap.`,
      ...(d.ph ? { images: [photoURL(d, 800)] } : {}),
    },
  };
}

const TAG_LABEL: Record<string, string> = {
  trending: "🔥 Trending",
  popular: "⭐ Popular",
  beach: "🏖️ Beach",
  city: "🏙️ City break",
  mountain: "⛰️ Mountains",
  island: "🏝️ Island",
  ski: "🎿 Ski",
  park: "🌲 Nature & parks",
  romantic: "💕 Romantic",
  family: "👨‍👩‍👧 Family-friendly",
};

export default function DestinationPage({ params }: { params: { slug: string } }) {
  const d = bySlug(params.slug);
  if (!d) notFound();

  const info = COUNTRY[d.country];
  const related = allDestinations
    .filter((x) => x.city !== d.city && (x.country === d.country || x.tags.some((t) => d.tags.includes(t))))
    .slice(0, 6);

  return (
    <div className="screen-body" style={{ paddingBottom: 120 }}>
      {/* hero */}
      <div
        className="rs-hero"
        style={d.ph ? { backgroundImage: `url('${photoURL(d, 800)}')` } : { background: "linear-gradient(160deg,#3E7BFF,#5C5BF0 55%,#9B3FE6)" }}
      >
        <div className="rs-hero-ov" />
        <div className="rs-hero-top">
          <span className="rs-chip">{d.flag} {d.country}</span>
        </div>
        <div className="rs-hero-cap">
          <div className="rs-hero-sub">{d.iata ? `Nearest airport · ${d.iata}` : d.country}</div>
          <h1 className="rs-hero-h1">{d.city}</h1>
          <div className="rs-hero-meta">{d.tags.map((t) => TAG_LABEL[t]).filter(Boolean).join(" · ")}</div>
        </div>
      </div>

      {/* pitch + CTA */}
      <p className="muted text-[14.5px] leading-[1.55] mt-5">
        Tell Trippa your dates, travelers and budget — the AI builds a complete {d.city} trip in
        seconds: flights, hand-picked stays, a day-by-day itinerary on a live map, weather, packing
        list and a budget it never exceeds.
      </p>
      <Link href={`/plan?dest=${encodeURIComponent(d.city)}`} className="btn btn-primary tap mt-4" style={{ textDecoration: "none" }}>
        ✨ Plan my {d.city} trip with AI
      </Link>

      {/* quick facts */}
      <div className="rs-sec">Good to know</div>
      <div className="card p-[15px] flex flex-col gap-[10px]">
        <div className="rs-fact">
          <span>✈️</span>
          <div>
            <b className="text-[13px]">Getting there</b>
            <div className="dim text-[12px]">Nearest airport: {d.iata || "—"} ({d.city})</div>
          </div>
        </div>
        {info && (
          <>
            <div className="rs-fact">
              <span>💶</span>
              <div>
                <b className="text-[13px]">Tipping &amp; tax</b>
                <div className="dim text-[12px]">{info.note}</div>
              </div>
            </div>
            <div className="rs-fact">
              <span>🚨</span>
              <div>
                <b className="text-[13px]">Emergency number</b>
                <div className="dim text-[12px]">
                  Dial {info.gen || info.pol || "112"} in {d.country}
                </div>
              </div>
            </div>
          </>
        )}
        <div className="rs-fact">
          <span>🧭</span>
          <div>
            <b className="text-[13px]">Best for</b>
            <div className="dim text-[12px]">{d.tags.map((t) => TAG_LABEL[t]?.replace(/^\S+\s/, "")).filter(Boolean).join(", ")}</div>
          </div>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <>
          <div className="rs-sec">Similar destinations</div>
          <div className="flex flex-col gap-[9px]">
            {related.map((r) => (
              <Link
                key={r.city}
                href={`/destinations/${slugOf(r.city)}`}
                className="card tap p-[13px] flex items-center gap-3"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="text-[22px]">{r.flag}</span>
                <div className="flex-1">
                  <b className="text-[14.5px]">{r.city}</b>
                  <div className="dim text-[12px]">{r.country}</div>
                </div>
                <span className="t-acc text-[12.5px] font-bold">Plan ›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <Link href="/destinations" className="t-acc text-[13px] font-semibold mt-6 block" style={{ textDecoration: "none" }}>
        ← All destinations
      </Link>
    </div>
  );
}
