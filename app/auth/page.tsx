"use client";

/* Login / Register — Supabase email+password. Empty fields keep you
   on-screen (no fake login). Guest mode when Supabase is unavailable. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import TrippaMark from "@/components/TrippaMark";
import { userService } from "@/lib/services/userService";
import { supabaseClient } from "@/lib/services/supabaseClient";
import { toast } from "@/components/Toast";
import { useT } from "@/lib/i18n";

export default function AuthPage() {
  const router = useRouter();
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const sbOn = supabaseClient.enabled();

  async function submit() {
    setMsg("");
    if (!email.trim() || !pass) {
      setMsg(t("auth.missing"));
      return;
    }
    if (!sbOn) {
      setMsg("Supabase isn't configured — continue as guest below.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") await userService.signIn(email.trim(), pass);
      else await userService.signUp(email.trim(), pass, name.trim() || undefined);
      toast(mode === "signin" ? "Welcome back ✓" : "Account created ✓");
      router.push("/");
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-body" style={{ paddingBottom: 30 }}>
      <div className="flex items-center gap-[10px]">
        <TrippaMark size={24} />
        <span className="text-[22px] font-extrabold tracking-[-0.03em]">
          Trip<span className="t-acc">pa</span>
        </span>
      </div>
      <h1 className="text-[29px] mt-7">{t("auth.welcome")}</h1>
      <p className="muted mt-[10px] text-[14.5px] leading-[1.5]">{t("auth.sub")}</p>

      <div className="seg acc mt-6">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={mode === m ? "on" : ""}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {m === "signin" ? t("auth.signin") : t("auth.register")}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[14px] mt-[22px]">
        {mode === "signup" && (
          <div className="field">
            <label>{t("auth.name")}</label>
            <div className="input">
              <User size={18} color="var(--text-3)" strokeWidth={2} />
              <input placeholder={t("auth.namePh")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}
        <div className="field">
          <label>{t("auth.email")}</label>
          <div className="input">
            <Mail size={18} color="var(--text-3)" strokeWidth={2} />
            <input type="email" placeholder="you@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>{t("auth.password")}</label>
          <div className="input">
            <Lock size={18} color="var(--text-3)" strokeWidth={2} />
            <input
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
        </div>
        <div className="text-[12.5px] min-h-4 leading-[1.4]" role="alert" style={{ color: "var(--pink)" }}>
          {msg}
        </div>
        <button className="btn btn-primary tap" onClick={submit} disabled={busy}>
          {busy ? "…" : mode === "signin" ? t("auth.signin") : t("auth.create")}
        </button>
      </div>

      <div className="flex items-center gap-3 my-6">
        <div className="divider" />
        <span className="dim text-[12px]">{t("auth.or")}</span>
        <div className="divider" />
      </div>

      <button
        className="btn btn-ghost tap"
        onClick={() => {
          userService.continueAsGuest(name.trim() || undefined);
          toast(t("auth.guestToast"));
          router.push("/");
        }}
      >
        {t("auth.guest")}
      </button>
      {!sbOn && (
        <p className="dim text-[11.5px] text-center mt-3 leading-[1.5]">
          {t("auth.guestNote")}
        </p>
      )}
    </div>
  );
}
