"use client";

/* ============================================================
   Hotels — search & multi-partner price comparison (port of hotels.js).
   Rules: pets → only pet-friendly; children → family-friendly first
   (enforced inside hotelService). Prices are labelled estimates;
   every Book handoff goes through affiliate deep links.
   ============================================================ */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import EstimateBadge from "@/components/EstimateBadge";
import { SkeletonList } from "@/components/Skeleton";
import SheetShell from "@/components/SheetShell";
import { useTrip } from "@/lib/useTrip";
import { affiliateService } from "@/lib/services/affiliateService";
import { hotelService } from "@/lib/services/hotelService";
import { affiliate } from "@/lib/services/config";
import { store } from "@/lib/store";
import type { HotelOption, PlanState } from "@/lib/types";

const PHOTOS = [
  "1566073771259-6a8506099945",
  "1455587734955-081b22074882",
  "1551882547-ff40c63fe5fa",
  "1611892440504-42a792e24d32",
  "1571896349842-33c89424de2d",
  "1502672260266-1c1ef2d93688",
  "1520250497591-112f2f40a3f4",
  "1542314831-068cd1dbfeeb",
];
const hotelPhoto = (h: HotelOption, i: number) => {
  const seed = [...(h.name || "")].reduce((s, c) => s + c.charCodeAt(0), i);
  return `https://images.unsplash.com/photo-${PHOTOS[seed % PHOTOS.length]}?w=640&h=420&fit=crop&q=72`;
};

/* deterministic per-partner price spread so "compare" is stable */
function dealsFor(h: HotelOption, city: string) {
  const M = affiliate.travelpayoutsMarker;
  const partners = [
    { id: "booking", name: "Booking.com", color: "#003580", link: (n: string, c: string) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(n + " " + c)}` },
    { id: "hotellook", name: "Hotellook", color: "#1f9d63", commission: true, link: (n: string, c: string) => `https://search.hotellook.com/?query=${encodeURIComponent(n + " " + c)}&marker=${M}` },
    { id: "agoda", name: "Agoda", color: "#c2456b", link: (n: string, c: string) => `https://www.agoda.com/search?q=${encodeURIComponent(n + " " + c)}` },
    { id: "expedia", name: "Expedia", color: "#f6a609", link: (n: string, c: string) => `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(n + " " + c)}` },
  ];
  const base = h.priceEUR || 100;
  const seed = [...(h.name || "")].reduce((s, c) => s + c.charCodeAt(0), 0);
  return partners
    .map((p, i) => {
      const delta = ((seed * (i + 3)) % 17) - 7; // -7..+9
      return { ...p, price: Math.max(28, Math.round(base * (1 + delta / 100))), url: p.link(h.name, city) };
    })
    .sort((a, b) => a.price - b.price);
}

export default function HotelsPage() {
  const params = useParams<{ id: string }>();
  const { trip, mounted } = useTrip(params.id);
  const [list, setList] = useState<HotelOption[] | null>(null);
  const [isMock, setIsMock] = useState(true);
  const [sort, setSort] = useState<"price" | "rating" | "reviews">("price");
  const [maxPrice, setMaxPrice] = useState(600);
  const [open, setOpen] = useState<HotelOption | null>(null);

  const prof = store.get<Partial<PlanState>>("wizardProfile", {});
  const pets = prof.pets === "yes";
  const city = trip?.itin?.[0]?.city || (trip?.name || "").split(/[,&]/)[0].trim();

  useEffect(() => {
    if (!mounted || !city) return;
    hotelService
      .search({
        city,
        nights: Math.max(1, (trip?.days || 2) - 1),
        pets,
        children: (prof.children || 0) > 0,
        tier: prof.tier,
        tripId: trip?.id,
      })
      .then((r) => {
        setList(r.data || []);
        setIsMock(r.meta.mock);
      });
  }, [mounted, city]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return <div className="screen-body" />;
  if (!trip || !city)
    return (
      <>
        <ScreenHeader title="Hotels" />
        <div className="screen-body">
          <EmptyState
            emoji="🏨"
            text={"Search stays in any city worldwide —\nplan a trip and we'll pick the city for you."}
            ctaLabel="Plan a trip with AI"
            ctaHref="/plan"
          />
        </div>
      </>
    );

  let filtered = (list || []).filter((h) => h.priceEUR <= maxPrice);
  if (sort === "price") filtered = [...filtered].sort((a, b) => a.priceEUR - b.priceEUR);
  else if (sort === "rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else filtered = [...filtered].sort((a, b) => b.reviews - a.reviews);

  return (
    <>
      <ScreenHeader title="Hotels" backHref={`/trip/active`} />
      <div className="screen-body">
        <div className="ht-hero" style={trip.hero ? { backgroundImage: `url('${trip.hero}')` } : undefined}>
          <div className="ht-hero-ov" />
          <div className="ht-hero-cap">
            <div className="text-[19px] font-extrabold text-white">
              {pets ? `Pet-friendly stays in ${city} 🐾` : `Stays in ${city}`}
            </div>
            <div className="text-[12px]" style={{ color: "rgba(255,255,255,.85)" }}>
              {filtered.length} properties · compare 4 sites
            </div>
          </div>
        </div>

        {isMock && (
          <div className="ht-estnote">
            ⚡ Prices are AI estimates for planning — tap a property to compare live prices on Booking, Hotellook &amp; more.
          </div>
        )}

        <div className="ht-sort">
          {(
            [
              ["price", "Cheapest"],
              ["rating", "Top rated"],
              ["reviews", "Popular"],
            ] as const
          ).map(([k, l]) => (
            <span key={k} className={"ht-seg" + (sort === k ? " on" : "")} onClick={() => setSort(k)}>
              {l}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-[10px] mb-3 px-[2px]">
          <span className="dim text-[12px] whitespace-nowrap">Max €{maxPrice}/night</span>
          <input
            type="range"
            min={40}
            max={600}
            step={20}
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
            className="flex-1 ml-3"
            style={{ accentColor: "var(--accent)" }}
          />
        </div>

        <div className="flex flex-col gap-3">
          {list == null ? (
            <SkeletonList n={3} image />
          ) : filtered.length ? (
            filtered.map((h, i) => {
              const deals = dealsFor(h, city);
              const best = deals[0];
              return (
                <div key={h.name + i} className="card tap overflow-hidden" style={{ padding: 0 }} onClick={() => setOpen(h)}>
                  <div className="ht-img" style={{ backgroundImage: `url('${hotelPhoto(h, i)}')` }}>
                    {h.deal && <span className="ht-type">Deal</span>}
                  </div>
                  <div className="p-[13px]">
                    <div className="flex items-center justify-between">
                      <b className="text-[15px]">{h.name}</b>
                      <span className="ht-rating">{h.rating.toFixed(1)}</span>
                    </div>
                    <div className="dim text-[12px] mt-[2px]">
                      {h.area || city} · {h.reviews.toLocaleString()} reviews
                    </div>
                    <div className="flex flex-wrap gap-[6px] mt-[9px]">
                      {h.petFriendly && <span className="ht-am">🐾 Pet friendly</span>}
                      {h.familyFriendly && <span className="ht-am">👨‍👩‍👧 Family</span>}
                      {h.freeCancellation && <span className="ht-am">Free cancellation</span>}
                      {h.breakfast && <span className="ht-am">Breakfast</span>}
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <div className="dim text-[11px]">from · {best.name}</div>
                        <b className="text-[20px] tracking-[-0.02em]">€{best.price}</b>
                        <span className="dim text-[11px]"> /night</span>
                      </div>
                      <span className="ht-deal">Compare {deals.length} deals ›</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="dim text-center py-5">No matches — widen your filters.</div>
          )}
        </div>
      </div>

      {/* compare sheet */}
      {open && (
        <SheetShell ariaLabel={open.name} onClose={() => setOpen(null)}>
          {(close) => (
            <>
              <div
                className="ht-img"
                style={{ backgroundImage: `url('${hotelPhoto(open, (list || []).indexOf(open))}')`, borderRadius: 16, marginBottom: 14 }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <b className="text-[17px]">{open.name}</b>
                  <div className="dim text-[12px] mt-[2px]">{open.area || city}</div>
                </div>
                <span className="ht-rating text-[15px]">{open.rating.toFixed(1)}</span>
              </div>
              <div className="flex flex-wrap gap-[6px] my-3">
                {open.petFriendly && <span className="ht-am">🐾 Pet friendly</span>}
                {open.familyFriendly && <span className="ht-am">👨‍👩‍👧 Family</span>}
                {open.freeCancellation && <span className="ht-am">Free cancellation</span>}
                {open.breakfast && <span className="ht-am">Breakfast</span>}
                {isMock && <EstimateBadge />}
              </div>
              <div className="sec-lbl mb-2">COMPARE PRICES</div>
              <div className="flex flex-col gap-[9px]">
                {dealsFor(open, city).map((d, i) => (
                  <a
                    key={d.id}
                    className={"ht-deal-row tap" + (i === 0 ? " best" : "")}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      affiliateService.logClick({
                        provider: d.id,
                        bookingType: "hotel",
                        destination: city,
                        tripId: trip.id,
                      })
                    }
                  >
                    <span className="ht-dot" style={{ background: d.color }} />
                    <div className="flex-1">
                      <b className="text-[13.5px]">{d.name}</b>
                      {"commission" in d && d.commission && <span className="badge ml-[6px]">partner</span>}
                      {i === 0 && <span className="ht-best">Best price</span>}
                    </div>
                    <b className="text-[16px]">€{d.price}</b>
                    <ArrowUpRight size={16} color="var(--text-3)" strokeWidth={2} className="ml-2" />
                  </a>
                ))}
              </div>
              <button className="btn btn-ghost tap mt-4" onClick={close}>
                Close
              </button>
            </>
          )}
        </SheetShell>
      )}
    </>
  );
}
