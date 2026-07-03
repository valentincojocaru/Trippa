"use client";

/* ============================================================
   AI Trip Planner — 5-step wizard + review + processing.
   Port of the reference wizard.js / ai-trip.js.

   Non-negotiable rules implemented here:
   • Never guess trip info: departure, destination, dates,
     travelers, budget are required; the review checklist gates
     Generate (disabled until every requirement passes).
   • The budget is collected as a hard ceiling and passed to the
     generator as a constraint that must NOT be changed.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Search,
  X,
  Check,
  Pencil,
} from "lucide-react";
import TrippaMark from "@/components/TrippaMark";
import { store } from "@/lib/store";
import { toast } from "@/components/Toast";
import { destinationService } from "@/lib/services/destinationService";
import { trending, popular } from "@/data/destinations";
import DestImage from "@/components/DestImage";
import { generateTrip } from "@/lib/tripGenerator";
import { tripService } from "@/lib/services/userService";
import { PLAN_DEFAULTS, type PlanState } from "@/lib/types";
import { iso, parseISO } from "@/lib/util";

type Phase = { kind: "step"; i: number } | { kind: "review" } | { kind: "processing" };

const STEP_COUNT = 5;

/* deterministic price tier per date: 0 cheap / 1 mid / 2 pricey */
function priceTier(d: Date): 0 | 1 | 2 {
  const k = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  const wd = d.getDay();
  let v = (((k * 2654435761) >>> 0) % 100) / 100;
  if (wd === 5 || wd === 6) v += 0.35;
  if (wd === 2 || wd === 3) v -= 0.2;
  return v < 0.33 ? 0 : v < 0.7 ? 1 : 2;
}

export default function PlanPage() {
  const router = useRouter();
  const [S, setS] = useState<PlanState>(PLAN_DEFAULTS);
  const [phase, setPhase] = useState<Phase>({ kind: "step", i: 0 });
  const [calOffset, setCalOffset] = useState(0);
  const [destQuery, setDestQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  /* resume draft + planSeed from home */
  useEffect(() => {
    const draft = { ...PLAN_DEFAULTS, ...store.get<Partial<PlanState>>("wizard", {}) };
    const seed = store.get<string | null>("planSeed", null);
    if (seed) {
      draft.dest = seed;
      draft.surprise = false;
      store.set("planSeed", null);
    }
    setS(draft);
    setDestQuery(draft.dest || "");
    setLoaded(true);
  }, []);

  const save = (next: PlanState) => {
    setS(next);
    store.set("wizard", next);
  };
  const patch = (p: Partial<PlanState>) => save({ ...S, ...p });

  /* ------------ validation per step ------------ */
  const stepValid = (i: number): boolean => {
    if (i === 0) return (S.origin || "").trim().length > 1 && (S.surprise || (S.dest || "").trim().length > 1);
    return true;
  };

  /* ------------ required-info checklist (gates Generate) ------------ */
  const reqs = useMemo(
    () => [
      { k: "Departure", ok: (S.origin || "").trim().length > 1, idx: 0 },
      { k: "Destination", ok: S.surprise || (S.dest || "").trim().length > 1, idx: 0 },
      { k: "Dates", ok: !!S.depart, idx: 1 },
      { k: "Travelers", ok: (S.adults || 0) > 0, idx: 2 },
      { k: "Budget", ok: (S.budgetTotal || 0) > 0, idx: 3 },
    ],
    [S]
  );
  const missing = reqs.filter((r) => !r.ok);
  const ready = missing.length === 0;

  /* ------------ date helpers ------------ */
  function pickDay(ds: string) {
    const d = parseISO(ds);
    if (S.tripType !== "round") {
      patch({ depart: ds, ret: "", days: 1 });
      return;
    }
    if (!S.depart || (S.depart && S.ret) || d < parseISO(S.depart)) patch({ depart: ds, ret: "" });
    else if (ds === S.depart) return;
    else patch({ ret: ds, days: Math.max(1, Math.round((parseISO(ds).getTime() - parseISO(S.depart).getTime()) / 86400e3)) });
  }
  function setRange(startOffsetDays: number, nights: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + startOffsetDays);
    const p: Partial<PlanState> = { depart: iso(d) };
    if (S.tripType === "round") {
      const r = new Date(d);
      r.setDate(r.getDate() + nights);
      p.ret = iso(r);
      p.days = nights;
    } else {
      p.ret = "";
      p.days = 1;
    }
    setCalOffset((d.getFullYear() - new Date().getFullYear()) * 12 + (d.getMonth() - new Date().getMonth()));
    patch(p);
  }
  function dateSummary(): string {
    if (!S.depart) return "Select dates";
    const f = (x: Date) => x.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const d1 = parseISO(S.depart);
    if (S.tripType !== "round") return f(d1);
    if (!S.ret) return f(d1) + " → ?";
    const d2 = parseISO(S.ret);
    const n = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400e3));
    return `${f(d1)} → ${f(d2)} · ${n} night${n !== 1 ? "s" : ""}`;
  }

  function budgetTip(): string {
    const b = S.budgetTotal || 2000;
    const nights = Math.max(1, S.days - 1);
    const party = S.adults + S.children || 1;
    const perNight = Math.round(b / (S.perPerson ? 1 : party) / nights);
    if (S.tier === "Luxury") return `At Luxury level we'll target 5★ stays and premium cabins within €${b.toLocaleString()}.`;
    if (b < 700) return `Tight but doable — flying mid-week and picking hostels/apartments stretches this furthest.`;
    if (S.flex === "exact") return `Leaving 1–2 days later could save ~€${Math.round(b * 0.09).toLocaleString()}. Try flexible dates in step 2.`;
    return `≈ €${perNight.toLocaleString()}/night for stays after flights — comfortable for ${S.tier} in most cities.`;
  }

  /* ------------ navigation ------------ */
  function goNext() {
    if (phase.kind !== "step") return;
    if (!stepValid(phase.i)) {
      toast("Please complete this step");
      return;
    }
    if (phase.i + 1 >= STEP_COUNT) setPhase({ kind: "review" });
    else setPhase({ kind: "step", i: phase.i + 1 });
  }
  function goPrev() {
    if (phase.kind === "review") {
      setPhase({ kind: "step", i: STEP_COUNT - 1 });
      return;
    }
    if (phase.kind !== "step") return;
    if (phase.i === 0) router.push("/");
    else setPhase({ kind: "step", i: phase.i - 1 });
  }

  if (!loaded) return <div className="screen-body" />;
  if (phase.kind === "processing") return <Processing S={S} />;

  /* =============== review =============== */
  if (phase.kind === "review") {
    const travelers =
      [
        `${S.adults} adult${S.adults !== 1 ? "s" : ""}`,
        S.children ? `${S.children} child` : "",
        S.infants ? `${S.infants} infant` : "",
        S.seniors ? `${S.seniors} senior` : "",
      ]
        .filter(Boolean)
        .join(", ") + (S.pets === "yes" ? ` · ${S.petCount} ${S.petType.toLowerCase()}` : "");

    const row = (label: string, val: string, idx: number) => (
      <div className="rv-row tap" key={label} onClick={() => setPhase({ kind: "step", i: idx })}>
        <div className="flex-1">
          <div className="dim text-[11px] tracking-[0.1em]">{label.toUpperCase()}</div>
          <b className="text-[14px]">{val || "—"}</b>
        </div>
        <Pencil size={16} color="#9295A0" strokeWidth={2} />
      </div>
    );

    return (
      <div className="flex flex-col min-h-dvh">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="wz-ic tap" onClick={goPrev}>
            <ChevronLeft size={17} strokeWidth={2.2} />
          </div>
          <b className="text-[15px]">Review &amp; confirm</b>
          <span style={{ width: 38 }} />
        </div>
        <div className="flex-1 px-5 pt-[14px]" style={{ paddingBottom: 130 }}>
          <h1 className="text-[25px] tracking-[-0.02em]">
            {S.surprise ? "Surprise destination ✨" : S.dest || "Your trip"}
          </h1>
          <p className="muted text-[13.5px] mt-1">
            {S.days} days · {S.tier} · {travelers}
          </p>
          <div className="mt-[18px]">
            {row("Destination", S.surprise ? "Surprise me" : S.dest, 0)}
            {row(
              "Dates",
              (S.depart || "flexible") + (S.ret ? " → " + S.ret : "") + ` · ${S.flex === "exact" ? "exact" : S.flex === "p3" ? "±3d" : "±7d"}`,
              1
            )}
            {row("Travelers", travelers, 2)}
            {row("Budget", `€${S.budgetTotal.toLocaleString()}${S.perPerson ? " pp" : ""} · ${S.tier}`, 3)}
          </div>
          <div className="wz-hint mt-4">
            ✨ Trippa will find the best flights &amp; stays, build a day-by-day plan, and estimate your full budget.
          </div>
          <div className="dim text-[11px] tracking-[0.1em] mt-5 mb-[9px]">REQUIRED INFO</div>
          <div className="rv-checklist">
            {reqs.map((r) => (
              <div key={r.k} className="rv-chk tap" onClick={() => setPhase({ kind: "step", i: r.idx })}>
                <span>{r.k}</span>
                {r.ok ? (
                  <Check size={16} color="var(--green)" strokeWidth={2.6} />
                ) : (
                  <X size={16} color="var(--pink)" strokeWidth={2.6} />
                )}
              </div>
            ))}
          </div>
          {!ready && (
            <div
              className="wz-hint mt-3"
              style={{ background: "rgba(219,39,119,.08)", borderColor: "rgba(219,39,119,.22)", color: "var(--text)" }}
            >
              Please complete: <b>{missing.map((m) => m.k).join(", ")}</b> before generating.
            </div>
          )}
        </div>
        <div className="wz-footer">
          <button
            className="wz-next tap"
            disabled={!ready}
            onClick={() => {
              store.set("wizardProfile", S); // keep full profile for the results dashboard
              setPhase({ kind: "processing" });
            }}
          >
            ✨ Generate my trip <ArrowRight size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  }

  /* =============== steps =============== */
  const stepIdx = phase.i;
  const titles: [string, string][] = [
    ["Where to?", "Search any city — or let Trippa surprise you."],
    ["When?", "Pick your dates. We calculate the rest."],
    ["Who's going?", "Your travel party."],
    ["Budget", "Set your spend — Trippa plans within it."],
    ["Luggage", "What are you bringing along?"],
  ];
  const pct = Math.round((stepIdx / STEP_COUNT) * 100);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* header */}
      <div className="px-[18px] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="wz-ic tap" onClick={goPrev}>
            <ChevronLeft size={20} strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2">
            <TrippaMark size={14} />
            <b className="text-[14.5px]">Trippa AI</b>
          </div>
          <div className="text-[12px] font-bold dim tabular-nums">
            {stepIdx + 1}/{STEP_COUNT}
          </div>
        </div>
        <div className="wz-prog mt-3">
          <div className="wz-prog-fill" style={{ width: pct + "%" }} />
        </div>
      </div>

      <div className="flex-1 px-[18px] pt-2" style={{ paddingBottom: 120 }}>
        <h1 className="wz-title mt-3">{titles[stepIdx][0]}</h1>
        <p className="wz-sub">{titles[stepIdx][1]}</p>
        <div className="wz-content">
          {stepIdx === 0 && (
            <StepDestination S={S} patch={patch} destQuery={destQuery} setDestQuery={setDestQuery} />
          )}
          {stepIdx === 1 && (
            <StepDates
              S={S}
              patch={patch}
              calOffset={calOffset}
              setCalOffset={setCalOffset}
              pickDay={pickDay}
              setRange={setRange}
              dateSummary={dateSummary}
            />
          )}
          {stepIdx === 2 && <StepTravelers S={S} patch={patch} />}
          {stepIdx === 3 && <StepBudget S={S} patch={patch} budgetTip={budgetTip} />}
          {stepIdx === 4 && <StepLuggage S={S} patch={patch} />}
        </div>
      </div>

      <div className="wz-footer">
        <button className="wz-next tap" disabled={!stepValid(stepIdx)} onClick={goNext}>
          {stepIdx === STEP_COUNT - 1 ? "Review trip" : "Continue"}
          <ArrowRight size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/* ================= step 1 — destination + origin ================= */
function StepDestination({
  S,
  patch,
  destQuery,
  setDestQuery,
}: {
  S: PlanState;
  patch: (p: Partial<PlanState>) => void;
  destQuery: string;
  setDestQuery: (s: string) => void;
}) {
  const results = destQuery.trim() ? destinationService.searchSync(destQuery) : [];
  const pick = (city: string) => {
    setDestQuery(city);
    patch({ dest: city, surprise: false });
  };
  return (
    <>
      <div className="wz-search">
        <Search className="wz-search-ic" size={20} strokeWidth={2} />
        <input
          className="wz-search-in"
          placeholder="Where do you want to go?"
          value={destQuery}
          autoComplete="off"
          onChange={(e) => {
            setDestQuery(e.target.value);
            patch({ dest: e.target.value, surprise: false });
          }}
        />
        {destQuery && (
          <button
            className="wz-search-clr"
            onClick={() => {
              setDestQuery("");
              patch({ dest: "" });
            }}
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="wz-ac">
          {results.map((d) => (
            <button key={d.city + d.iata} className="wz-ac-row tap" onClick={() => pick(d.city)}>
              <DestImage d={d} size={160} className="wz-ac-ph">
                <span className="wz-ac-flag">{d.flag}</span>
              </DestImage>
              <span className="flex flex-col gap-[2px] flex-1 min-w-0">
                <b className="text-[15px] tracking-[-0.01em]">{d.city}</b>
                <span className="dim text-[12px]">
                  {d.country} · {d.iata}
                </span>
              </span>
              <span className="flex flex-col gap-1 items-end">
                {d.tags.includes("popular") && <span className="wz-bdg pop">Popular</span>}
                {d.tags.includes("trending") && <span className="wz-bdg trd">🔥 Trending</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="wz-field">
            <label>Flying from</label>
            <input
              className="wz-input"
              placeholder="Your city or airport — e.g. Bucharest (OTP)"
              value={S.origin}
              onChange={(e) => patch({ origin: e.target.value })}
            />
          </div>
          <div className="wz-lab">TRIP TYPE</div>
          <div className="wz-chips">
            {(
              [
                ["round", "Round trip"],
                ["oneway", "One-way"],
              ] as const
            ).map(([v, l]) => (
              <button key={v} className={"wz-chip" + (S.tripType === v ? " on" : "")} onClick={() => patch({ tripType: v })}>
                {l}
              </button>
            ))}
          </div>
          <div className={"wz-surprise tap" + (S.surprise ? " on" : "")} onClick={() => patch({ surprise: !S.surprise })}>
            <span className="itile glass2" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 18 }}>
              ✨
            </span>
            <div className="flex-1">
              <b className="text-[14px]">Surprise me</b>
              <div className="dim text-[11.5px]">Let AI choose a destination for your vibe &amp; budget</div>
            </div>
            <span className={"wz-tg-box" + (S.surprise ? " on" : "")} />
          </div>
          <div className="wz-lab">🔥 TRENDING NOW</div>
          <div className="wz-dchips">
            {trending.map((d) => (
              <button key={d.city} className="wz-dchip tap" onClick={() => pick(d.city)}>
                <span>{d.flag}</span>
                {d.city}
              </button>
            ))}
          </div>
          <div className="wz-lab">⭐ POPULAR THIS MONTH</div>
          <div className="wz-dchips">
            {popular.map((d) => (
              <button key={d.city} className="wz-dchip tap" onClick={() => pick(d.city)}>
                <span>{d.flag}</span>
                {d.city}
              </button>
            ))}
          </div>
        </>
      )}
      {results.length > 0 && (
        <div className="wz-field">
          <label>Flying from</label>
          <input
            className="wz-input"
            placeholder="Your city or airport — e.g. Bucharest (OTP)"
            value={S.origin}
            onChange={(e) => patch({ origin: e.target.value })}
          />
        </div>
      )}
    </>
  );
}

/* ================= step 2 — dates ================= */
function StepDates({
  S,
  patch,
  calOffset,
  setCalOffset,
  pickDay,
  setRange,
  dateSummary,
}: {
  S: PlanState;
  patch: (p: Partial<PlanState>) => void;
  calOffset: number;
  setCalOffset: (n: number) => void;
  pickDay: (ds: string) => void;
  setRange: (o: number, n: number) => void;
  dateSummary: () => string;
}) {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + calOffset);
  const y = base.getFullYear(),
    m = base.getMonth();
  const monthName = base.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const first = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dep = S.depart ? parseISO(S.depart) : null;
  const ret = S.ret ? parseISO(S.ret) : null;

  const cells: JSX.Element[] = [];
  for (let i = 0; i < first; i++) cells.push(<span key={"e" + i} className="wz-cd empty" />);
  for (let day = 1; day <= dim; day++) {
    const d = new Date(y, m, day);
    const ds = iso(d);
    const past = d < today;
    const isDep = dep && iso(dep) === ds;
    const isRet = ret && iso(ret) === ds;
    const inRange = dep && ret && d > dep && d < ret;
    const tier = priceTier(d);
    const cls = ["wz-cd", past ? "past" : "", isDep ? "dep" : "", isRet ? "ret" : "", inRange ? "rng" : ""]
      .filter(Boolean)
      .join(" ");
    cells.push(
      <button key={ds} className={cls} disabled={past} onClick={() => pickDay(ds)}>
        {day}
        {!past && !isDep && !isRet && <span className={"wz-pdot t" + tier} />}
      </button>
    );
  }

  return (
    <>
      <div className="wz-cal-quick">
        <button
          className="wz-qbtn tap"
          onClick={() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            const add = (5 - d.getDay() + 7) % 7 || 7;
            setRange(add, 2);
          }}
        >
          <b>Weekend</b>
          <span>Fri → Sun</span>
        </button>
        <button className="wz-qbtn tap" onClick={() => setRange(14, 7)}>
          <b>One week</b>
          <span>7 nights</span>
        </button>
        <button className="wz-qbtn tap" onClick={() => setRange(21, 14)}>
          <b>Two weeks</b>
          <span>14 nights</span>
        </button>
      </div>

      <div className="wz-cal">
        <div className="wz-cal-top">
          <button className="wz-cal-nav tap" disabled={calOffset <= 0} onClick={() => setCalOffset(Math.max(0, calOffset - 1))}>
            <ChevronLeft size={18} strokeWidth={2.3} />
          </button>
          <b>{monthName}</b>
          <button className="wz-cal-nav tap" onClick={() => setCalOffset(calOffset + 1)}>
            <ChevronRight size={18} strokeWidth={2.3} />
          </button>
        </div>
        <div className="wz-cal-dow">
          {["S", "M", "T", "W", "T2", "F", "S2"].map((x) => (
            <span key={x}>{x.slice(0, 1)}</span>
          ))}
        </div>
        <div className="wz-cal-grid">{cells}</div>
        <div className="wz-cal-legend">
          <span>
            <i className="wz-pdot t0" />
            Cheap
          </span>
          <span>
            <i className="wz-pdot t1" />
            Average
          </span>
          <span>
            <i className="wz-pdot t2" />
            Pricey
          </span>
        </div>
      </div>

      <div className="wz-lab">FLEXIBILITY</div>
      <div className="wz-chips">
        {(
          [
            ["exact", "Exact"],
            ["p3", "±3 days"],
            ["p7", "±7 days"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={"wz-chip" + (S.flex === v ? " on" : "")} onClick={() => patch({ flex: v })}>
            {l}
          </button>
        ))}
      </div>

      <div className="wz-daysbox">
        <div>
          <span className="dim text-[12px]">{S.tripType === "round" ? "Trip length" : "Departure"}</span>
          <div className="text-[22px] font-bold mt-[1px]">{dateSummary()}</div>
        </div>
        <span className={"wz-cal-dot" + (S.depart ? " ok" : "")}>{S.depart ? "✓" : ""}</span>
      </div>
      <div className="wz-hint">
        💡{" "}
        {S.flex === "exact"
          ? "Green dots mark the cheapest days to fly."
          : "We'll scan nearby dates and flag cheaper options automatically."}
      </div>
    </>
  );
}

/* ================= step 3 — travelers + pets ================= */
function StepTravelers({ S, patch }: { S: PlanState; patch: (p: Partial<PlanState>) => void }) {
  const TINT: Record<string, [string, string]> = {
    adults: ["rgba(37,99,235,.1)", "var(--accent)"],
    children: ["rgba(22,163,74,.12)", "var(--green)"],
    infants: ["rgba(219,39,119,.1)", "var(--pink)"],
    seniors: ["rgba(202,138,4,.13)", "var(--yellow)"],
  };
  const trav = (key: "adults" | "children" | "infants" | "seniors", label: string, sub: string, emoji: string, min: number, max: number) => {
    const v = S[key] || 0;
    const [bg, col] = TINT[key];
    return (
      <div className={"wz-trav" + (v > 0 ? " has" : "")} key={key}>
        <span className="wz-trav-ic" style={{ background: bg, color: col, fontSize: 20 }}>
          {emoji}
        </span>
        <div className="flex-1">
          <b className="text-[14.5px]">{label}</b>
          <div className="dim text-[11.5px]">{sub}</div>
        </div>
        <div className="wz-stepper">
          <button className="wz-mn tap" disabled={v <= min} onClick={() => patch({ [key]: Math.max(min, v - 1) } as any)}>
            −
          </button>
          <b>{v}</b>
          <button className="wz-pl tap" disabled={v >= max} onClick={() => patch({ [key]: Math.min(max, v + 1) } as any)}>
            +
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {trav("adults", "Adults", "13+ years", "🧑", 1, 12)}
      {trav("children", "Children", "2–12 years", "🧒", 0, 10)}
      {S.children > 0 && (
        <div className="wz-field">
          <label>Ages of children</label>
          <input
            className="wz-input"
            placeholder="e.g. 4, 7, 11"
            value={S.childAges.join(", ")}
            onChange={(e) =>
              patch({ childAges: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })
            }
          />
        </div>
      )}
      {trav("infants", "Infants", "Under 2", "👶", 0, 6)}
      {trav("seniors", "Seniors", "65+ years", "🧓", 0, 8)}

      <div className="wz-lab">PETS</div>
      <div className={"wz-pet-card" + (S.pets === "yes" ? " on" : "")}>
        <div className="wz-pet-head tap" onClick={() => patch({ pets: S.pets === "yes" ? "no" : "yes" })}>
          <span className="wz-trav-ic" style={{ background: "rgba(124,92,255,.12)", color: "var(--purple)", fontSize: 20 }}>
            🐾
          </span>
          <div className="flex-1">
            <b className="text-[14.5px]">Travelling with pets</b>
            <div className="dim text-[11.5px]">
              {S.pets === "yes" ? "We'll only show pet-friendly stays 🐾" : "Tap to add your furry companions"}
            </div>
          </div>
          <span className={"wz-tg-box" + (S.pets === "yes" ? " on" : "")} />
        </div>
        {S.pets === "yes" && (
          <div className="wz-pet-body">
            <div className="wz-pet-types">
              {(
                [
                  ["Dog", "🐶"],
                  ["Cat", "🐱"],
                  ["Other", "🐾"],
                ] as const
              ).map(([k, e]) => (
                <button key={k} className={"wz-pet-t tap" + (S.petType === k ? " on" : "")} onClick={() => patch({ petType: k })}>
                  <span>{e}</span>
                  {k}
                </button>
              ))}
            </div>
            <div className="wz-count">
              <b className="text-[14.5px]">Number of pets</b>
              <div className="wz-stepper">
                <button className="wz-mn tap" disabled={S.petCount <= 1} onClick={() => patch({ petCount: Math.max(1, S.petCount - 1) })}>
                  −
                </button>
                <b>{S.petCount}</b>
                <button className="wz-pl tap" disabled={S.petCount >= 6} onClick={() => patch({ petCount: Math.min(6, S.petCount + 1) })}>
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= step 4 — budget ================= */
function StepBudget({
  S,
  patch,
  budgetTip,
}: {
  S: PlanState;
  patch: (p: Partial<PlanState>) => void;
  budgetTip: () => string;
}) {
  const tiers = [
    { v: "Budget", e: "💸", d: "Smart & affordable" },
    { v: "Comfort", e: "⭐", d: "Great value picks" },
    { v: "Premium", e: "✨", d: "Elevated stays" },
    { v: "Luxury", e: "👑", d: "The very best" },
  ] as const;
  return (
    <>
      <div className="wz-tiers">
        {tiers.map((t) => (
          <button key={t.v} className={"wz-tier tap" + (S.tier === t.v ? " on" : "")} onClick={() => patch({ tier: t.v })}>
            <span className="wz-tier-e">{t.e}</span>
            <b>{t.v}</b>
            <span className="wz-tier-d">{t.d}</span>
          </button>
        ))}
      </div>
      <div className="wz-budget-box">
        <div className="flex items-center justify-between">
          <span className="dim text-[12.5px]">{S.perPerson ? "Per person" : "Total budget"}</span>
          <b className="t-acc text-[21px]">€{(S.budgetTotal || 0).toLocaleString()}</b>
        </div>
        <input
          type="range"
          className="wz-range mt-[10px]"
          min={300}
          max={15000}
          step={100}
          value={S.budgetTotal}
          onChange={(e) => patch({ budgetTotal: +e.target.value })}
        />
        <div className="flex justify-between mt-[2px]">
          <span className="wz-rng-lbl">€300</span>
          <span className="wz-rng-lbl">€15k+</span>
        </div>
      </div>
      <div className="wz-tg tap" onClick={() => patch({ perPerson: !S.perPerson })}>
        <div>
          <b className="text-[14px]">Budget is per person</b>
          <div className="dim text-[11.5px]">Otherwise total for the whole party</div>
        </div>
        <span className={"wz-tg-box" + (S.perPerson ? " on" : "")} />
      </div>
      <div className="wz-aitip">
        <span className="text-[18px]">✨</span>
        <div>
          <b className="text-[12.5px]">Trippa tip</b>
          <div className="dim text-[12px] leading-[1.4] mt-[1px]">{budgetTip()}</div>
        </div>
      </div>
    </>
  );
}

/* ================= step 5 — luggage ================= */
function StepLuggage({ S, patch }: { S: PlanState; patch: (p: Partial<PlanState>) => void }) {
  const bag = (k: "personal" | "cabin" | "checked", label: string, sub: string, emoji: string) => {
    const on = !!S.bags[k];
    return (
      <button
        key={k}
        className={"wz-bag tap" + (on ? " on" : "")}
        onClick={() => patch({ bags: { ...S.bags, [k]: !on } })}
      >
        <span className="wz-bag-ic" style={{ fontSize: 24 }}>
          {emoji}
        </span>
        <b>{label}</b>
        <span className="wz-bag-d">{sub}</span>
        <span className="wz-bag-chk">{on && <Check size={13} color="#fff" strokeWidth={3} />}</span>
      </button>
    );
  };
  const extra = (k: "sports" | "oversized", label: string, sub: string, emoji: string) => {
    const on = !!S[k];
    return (
      <button key={k} className={"wz-bag tap" + (on ? " on" : "")} onClick={() => patch({ [k]: !on } as any)}>
        <span className="wz-bag-ic" style={{ fontSize: 24 }}>
          {emoji}
        </span>
        <b>{label}</b>
        <span className="wz-bag-d">{sub}</span>
        <span className="wz-bag-chk">{on && <Check size={13} color="#fff" strokeWidth={3} />}</span>
      </button>
    );
  };
  return (
    <>
      <div className="wz-bags">
        {bag("personal", "Personal item", "Bag under the seat", "👜")}
        {bag("cabin", "Cabin bag", "Overhead carry-on", "🎒")}
        {bag("checked", "Checked bag", "Goes in the hold", "🧳")}
      </div>
      {S.bags.checked && (
        <div className="wz-count">
          <b className="text-[14.5px]">Checked bags per traveler</b>
          <div className="wz-stepper">
            <button className="wz-mn tap" disabled={S.bagsPer <= 1} onClick={() => patch({ bagsPer: Math.max(1, S.bagsPer - 1) })}>
              −
            </button>
            <b>{S.bagsPer}</b>
            <button className="wz-pl tap" disabled={S.bagsPer >= 5} onClick={() => patch({ bagsPer: Math.min(5, S.bagsPer + 1) })}>
              +
            </button>
          </div>
        </div>
      )}
      <div className="wz-lab">EXTRAS</div>
      <div className="wz-bags two">
        {extra("sports", "Sports gear", "Skis, golf, surf", "⛷️")}
        {extra("oversized", "Oversized", "Instruments, strollers", "🎸")}
      </div>
    </>
  );
}

/* ================= processing (AI live steps) ================= */
function Processing({ S }: { S: PlanState }) {
  const router = useRouter();
  const [stepText, setStepText] = useState("Talking to Trippa AI…");
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<null | "no-key" | "generic">(null);
  const startedRef = useRef(false);

  const steps = useMemo(() => {
    const hasPets = S.pets === "yes";
    return [
      { ic: "✈️", t: "Finding the best flights" },
      { ic: "🏨", t: "Searching top-rated hotels" },
      ...(hasPets ? [{ ic: "🐶", t: "Filtering pet-friendly stays" }] : []),
      { ic: "📍", t: "Building the perfect route" },
      { ic: "🍜", t: "Picking great restaurants" },
      { ic: "🌤", t: "Checking the weather" },
      { ic: "💶", t: "Optimizing your budget" },
      { ic: "🧳", t: "Creating your packing list" },
      { ic: "✨", t: "Putting it all together" },
    ];
  }, [S.pets]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const n = steps.length;
    // auto-advance, but never finish the last 2 until the real work is done
    const iv = setInterval(() => {
      setIdx((i) => (i < n - 2 ? i + 1 : i));
    }, 950);

    (async () => {
      try {
        const trip = await generateTrip(S, { withActivities: true }, setStepText);
        clearInterval(iv);
        setIdx(n - 1);
        setStepText("Saving your trip…");
        tripService.save(trip);
        tripService.activate(trip);
        setTimeout(() => router.replace("/trip/" + trip.id), 350);
      } catch (e: any) {
        clearInterval(iv);
        setError(/no-key/.test(e?.message || "") ? "no-key" : "generic");
      }
    })();

    return () => clearInterval(iv);
  }, [S, steps, router]);

  if (error) {
    return (
      <div className="screen-body items-center text-center pt-12">
        <div
          className="itile"
          style={{ width: 60, height: 60, borderRadius: 20, background: "rgba(194,69,107,.12)", color: "#C2456B", fontSize: 26 }}
        >
          ⚠️
        </div>
        <b className="text-[17px] mt-4">{error === "no-key" ? "Add your AI key" : "Couldn't build that trip"}</b>
        <div className="muted text-[13px] mt-[6px] max-w-[260px]">
          {error === "no-key"
            ? "To plan AI trips, paste your OpenAI or Anthropic key in Settings — it stays only on your device."
            : "The planner needs a connection. Check you're online and try again."}
        </div>
        <button
          className="btn btn-primary tap mt-[18px]"
          style={{ maxWidth: 220 }}
          onClick={() => router.push(error === "no-key" ? "/settings" : "/plan")}
        >
          {error === "no-key" ? "Open Settings" : "Try again"}
        </button>
      </div>
    );
  }

  const dest = S.surprise ? "your surprise destination" : S.dest || "";
  return (
    <div className="screen-body">
      <div className="ai-loading2">
        <div className="ai-hero-orb">
          <span className="ai-orb-ring" />
          <span className="ai-orb-ring" />
          <span className="ai-orb-core">
            {/* the brand jet, flying while the AI plans */}
            <svg width="34" height="34" viewBox="0 0 24 24" style={{ transform: "rotate(42deg)" }}>
              <path
                d="M21.5 15.5v-2l-8-5V3a1.5 1.5 0 0 0-3 0v5.5l-8 5v2l8-2.5v5.5l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-5.5l8 2.5z"
                fill="#fff"
              />
            </svg>
          </span>
        </div>
        <b className="text-[19px] mt-6 tracking-[-0.02em]">
          Planning your trip{dest ? ` to ${String(dest).split(",")[0]}` : ""}
        </b>
        <div className="muted text-[13px] mt-[5px] min-h-[18px]">{stepText}</div>
        <div className="ai-prog2">
          <div className="ai-prog2-fill" style={{ width: Math.round((idx / steps.length) * 100) + "%" }} />
        </div>
        <div className="ai-steps2">
          {steps.map((s, i) => (
            <div key={s.t} className={"ai-stp2" + (i === idx ? " active" : i < idx ? " done" : "")}>
              <span className="ai-stp2-ic">{s.ic}</span>
              <span className="ai-stp2-t">{s.t}</span>
              <span className="ai-stp2-chk">
                <Check size={13} color="#fff" strokeWidth={3} />
              </span>
              <span className="ai-stp2-spin" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
