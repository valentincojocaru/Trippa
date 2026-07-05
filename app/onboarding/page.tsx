"use client";

/* Onboarding — cinematic value prop + a 3-tap traveler style quiz.
   The profile is injected into every AI prompt afterwards, so plans
   match how this person actually travels. Both steps skippable. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import TrippaMark from "@/components/TrippaMark";
import { store } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { setTravelProfile, type TravelProfile } from "@/lib/travelProfile";

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const [phase, setPhase] = useState<"intro" | "quiz">("intro");
  const [styles, setStyles] = useState<string[]>([]);
  const [party, setParty] = useState<TravelProfile["party"]>("");
  const [tier, setTier] = useState<TravelProfile["tier"]>("");

  const done = (to: string) => {
    store.set("onboarded", true);
    router.push(to);
  };
  const finishQuiz = (save: boolean) => {
    if (save) setTravelProfile({ styles, party, tier });
    done("/auth");
  };

  /* ---- phase 2: traveler style quiz ---- */
  if (phase === "quiz") {
    const styleOpts = [
      ["relax", t("obq.relax")],
      ["adventure", t("obq.adventure")],
      ["foodie", t("obq.foodie")],
      ["culture", t("obq.culture")],
      ["nature", t("obq.nature")],
      ["nightlife", t("obq.nightlife")],
    ] as const;
    const partyOpts = [
      ["solo", t("obq.solo")],
      ["couple", t("obq.couple")],
      ["family", t("obq.family")],
      ["friends", t("obq.friends")],
    ] as const;
    const tiers = ["Budget", "Comfort", "Premium", "Luxury"] as const;

    return (
      <div className="screen-body" style={{ paddingBottom: 30 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrippaMark />
            <b className="text-[15px]">Trippa</b>
          </div>
          <button
            className="dim tap text-[13px]"
            style={{ background: "none", border: "none", fontFamily: "inherit" }}
            onClick={() => finishQuiz(false)}
          >
            {t("obq.skip")}
          </button>
        </div>

        <h1 className="text-[26px] mt-6">{t("obq.title")}</h1>
        <p className="muted text-[14px] mt-2 leading-[1.5]">{t("obq.sub")}</p>

        <div className="wz-lab mt-6">{t("obq.style")}</div>
        <div className="wz-chips mt-2">
          {styleOpts.map(([k, l]) => (
            <button
              key={k}
              className={"wz-chip" + (styles.includes(k) ? " on" : "")}
              onClick={() => setStyles((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="wz-lab mt-5">{t("obq.party")}</div>
        <div className="wz-chips mt-2">
          {partyOpts.map(([k, l]) => (
            <button key={k} className={"wz-chip" + (party === k ? " on" : "")} onClick={() => setParty(k)}>
              {l}
            </button>
          ))}
        </div>

        <div className="wz-lab mt-5">{t("obq.tier")}</div>
        <div className="wz-chips mt-2">
          {tiers.map((k) => (
            <button key={k} className={"wz-chip" + (tier === k ? " on" : "")} onClick={() => setTier(k)}>
              {k}
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-8">
          <div className="flex justify-center gap-[7px]">
            <i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--surface-2)" }} />
            <i style={{ width: 22, height: 7, borderRadius: 4, background: "var(--accent-grad)" }} />
          </div>
          <button className="btn btn-primary tap" onClick={() => finishQuiz(true)}>
            {t("obq.done")} <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-body" style={{ paddingBottom: 30 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrippaMark />
          <b className="text-[15px]">Trippa</b>
        </div>
        <button
          className="dim tap text-[13px]"
          style={{ background: "none", border: "none", fontFamily: "inherit" }}
          onClick={() => done("/")}
        >
          {t("ob.skip")}
        </button>
      </div>

      {/* hero photo with floating AI plan card — background-image fails
          silently to the gradient beneath, never a broken-image glyph */}
      <div className="relative overflow-hidden rounded-[24px] mt-[18px]" style={{ height: 380 }}>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(165deg, #1d2a4a, #2a3550 48%, #1b2340)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=700&q=70')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="photo-cap-ov" />
        <div className="glass absolute left-4 right-4 top-4 flex items-center gap-3 p-3" style={{ borderRadius: 16 }}>
          <span className="itile" style={{ width: 38, height: 38, background: "var(--accent-grad)", borderRadius: 12 }}>
            <Sparkles size={15} color="#fff" fill="#fff" />
          </span>
          <div className="flex-1">
            <b className="text-[13px]">7-day Italy · €3,000</b>
            <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
              {t("ob.ready")}
            </div>
          </div>
        </div>
        <div className="absolute left-4 right-4 bottom-4">
          <div className="flex gap-2 mb-[9px]">
            <span className="chip-ico">{t("ob.anywhere")}</span>
            <span className="chip-ico">{t("ob.days7")}</span>
          </div>
          <div className="text-[25px] font-bold text-white tracking-[-0.02em] leading-[1.1]">
            {t("ob.headline1")}
            <br />
            {t("ob.headline2")}
          </div>
        </div>
      </div>

      <p className="muted text-[14.5px] leading-[1.5] mt-6">
        {t("ob.sub")}
      </p>

      <div className="mt-auto flex flex-col gap-4 pt-8">
        <div className="flex justify-center gap-[7px]">
          <i style={{ width: 22, height: 7, borderRadius: 4, background: "var(--accent-grad)" }} />
          <i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--surface-2)" }} />
          <i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--surface-2)" }} />
        </div>
        <button className="btn btn-primary tap" onClick={() => setPhase("quiz")}>
          {t("ob.start")} <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
