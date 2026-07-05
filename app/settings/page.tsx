"use client";

/* ============================================================
   Settings — language, appearance, privacy and account.
   No API-key fields: AI keys live only on the server (environment
   variables) and are never entered, stored or exposed on the device.
   ============================================================ */

import { useRouter } from "next/navigation";
import ScreenHeader from "@/components/ScreenHeader";
import { userService } from "@/lib/services/userService";
import { toast } from "@/components/Toast";
import { useT, getLang, setLang } from "@/lib/i18n";
import { getTheme, setTheme } from "@/components/ThemeApplier";
import { useStoreVersion } from "@/lib/store";

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  useStoreVersion();

  return (
    <>
      <ScreenHeader title={t("pf.settings")} backHref="/profile" />
      <div className="screen-body">
        <div className="sec-lbl mb-2">{t("st.language")}</div>
        <div className="seg acc mb-5">
          {(["ro", "en"] as const).map((l) => (
            <span key={l} className={getLang() === l ? "on" : ""} onClick={() => setLang(l)}>
              {l === "ro" ? "🇷🇴 Română" : "🇬🇧 English"}
            </span>
          ))}
        </div>

        <div className="sec-lbl mb-2">{t("st.theme")}</div>
        <div className="seg acc mb-5">
          {(["auto", "light", "dark"] as const).map((m) => (
            <span key={m} className={getTheme() === m ? "on" : ""} onClick={() => setTheme(m)}>
              {m === "auto" ? t("st.auto") : m === "light" ? t("st.light") : t("st.dark")}
            </span>
          ))}
        </div>

        <div className="sec-lbl mb-2">{t("st.privacy")}</div>
        <div className="card p-[14px]">
          <div className="muted text-[12.5px] leading-[1.5]">{t("st.privacyNote")}</div>
        </div>

        <div className="sec-lbl mt-5 mb-2">{t("st.account")}</div>
        <button
          className="btn btn-ghost tap"
          onClick={() => {
            userService.signOut();
            toast("Signed out");
            router.push("/auth");
          }}
        >
          {t("st.signOut")}
        </button>
      </div>
    </>
  );
}
