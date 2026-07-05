"use client";

/* Floating frosted bottom tab bar — Home / Trips / + / Chat / Profile.
   Hidden on flows that own the full screen (wizard, processing, map…). */

import { usePathname, useRouter } from "next/navigation";
import { Home, Map as MapIcon, MessageCircle, User, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

const HIDDEN_PREFIXES = [
  "/plan",
  "/onboarding",
  "/auth",
  "/trip/", // trip tools own their layout; results shows its own CTA
];

export default function TabBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const t = useT();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const tab = (
    href: string,
    label: string,
    Icon: typeof Home,
    active: boolean
  ) => (
    <button
      className={"ico" + (active ? " on" : "")}
      onClick={() => router.push(href)}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={22} strokeWidth={2} />
      {label}
    </button>
  );

  return (
    <nav className="tabbar" aria-label="Main">
      {tab("/", t("tab.home"), Home, pathname === "/")}
      {tab("/trips", t("tab.trips"), MapIcon, pathname.startsWith("/trips"))}
      <button className="tab-fab" onClick={() => router.push("/plan")} aria-label="Plan a trip">
        <Sparkles size={24} color="#fff" strokeWidth={2.2} />
      </button>
      {tab("/chat", t("tab.chat"), MessageCircle, pathname.startsWith("/chat"))}
      {tab("/profile", t("tab.profile"), User, pathname.startsWith("/profile"))}
    </nav>
  );
}
