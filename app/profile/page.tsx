"use client";

/* Profile — account, links to My Trips / Favorites / Reminders /
   Help (concierge) / Settings. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Map as MapIcon,
  Bookmark,
  Bell,
  MessageCircle,
  Settings as SettingsIcon,
  Ticket,
  Wallet,
} from "lucide-react";
import { userService } from "@/lib/services/userService";
import { useT } from "@/lib/i18n";
import { useStoreVersion } from "@/lib/store";
import type { Trip } from "@/lib/types";
import { store } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const t = useT();
  useStoreVersion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="screen-body" />;

  const profile = userService.profile();
  const trips = store.get<Trip[]>("trips", []);
  const name = profile?.name || (profile?.email ? profile.email.split("@")[0] : t("pf.traveler"));
  const initial = (name[0] || "T").toUpperCase();

  const rows: { t: string; sub: string; Icon: typeof MapIcon; href: string }[] = [
    { t: t("pf.myTrips"), sub: `${trips.length} ${t("pf.trips")}`, Icon: MapIcon, href: "/trips" },
    { t: t("pf.saved"), sub: t("pf.savedSub"), Icon: Bookmark, href: "/favorites" },
    { t: t("pf.tickets"), sub: t("pf.ticketsSub"), Icon: Ticket, href: "/tools/tickets" },
    { t: t("pf.wallet"), sub: t("pf.walletSub"), Icon: Wallet, href: "/tools/wallet" },
    { t: t("pf.reminders"), sub: t("pf.remindersSub"), Icon: Bell, href: "/reminders" },
    { t: t("pf.help"), sub: t("pf.helpSub"), Icon: MessageCircle, href: "/chat" },
    { t: t("pf.settings"), sub: t("pf.settingsSub"), Icon: SettingsIcon, href: "/settings" },
  ];

  return (
    <div className="screen-body">
      <div className="flex flex-col items-center pt-4">
        <div
          className="itile"
          style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--accent-grad)", color: "#fff", fontSize: 32, fontWeight: 700 }}
        >
          {initial}
        </div>
        <h1 className="text-[22px] mt-3">{name}</h1>
        <div className="dim text-[13px] mt-1">
          {profile?.email || (userService.signedIn() ? "" : t("pf.guestNote"))}
        </div>
      </div>

      <div className="card mt-6" style={{ padding: "4px 16px" }}>
        {rows.map(({ t, sub, Icon, href }) => (
          <div className="lrow tap" key={t} onClick={() => router.push(href)}>
            <span className="itile glass2" style={{ width: 40, height: 40, borderRadius: 12, color: "var(--accent)" }}>
              <Icon size={19} strokeWidth={2} />
            </span>
            <div className="lt">
              <b>{t}</b>
              <span>{sub}</span>
            </div>
            <ChevronRight size={17} color="var(--text-3)" strokeWidth={2} />
          </div>
        ))}
      </div>
    </div>
  );
}
