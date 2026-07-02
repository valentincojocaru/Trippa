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

export default function AuthPage() {
  const router = useRouter();
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
      setMsg("Please enter your email and password.");
      return;
    }
    if (!sbOn) {
      setMsg("Supabase isn't configured — continue as guest below, or add keys in Settings.");
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
      <TrippaMark size={26} />
      <h1 className="text-[29px] mt-6">Welcome aboard</h1>
      <p className="muted mt-[10px] text-[14.5px]">Sign in to plan your next adventure.</p>

      <div className="seg acc mt-6">
        <span className={mode === "signin" ? "on" : ""} onClick={() => setMode("signin")}>
          Sign in
        </span>
        <span className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
          Register
        </span>
      </div>

      <div className="flex flex-col gap-[14px] mt-[22px]">
        {mode === "signup" && (
          <div className="field">
            <label>Name</label>
            <div className="input">
              <User size={18} color="#6E6E78" strokeWidth={2} />
              <input placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <div className="input">
            <Mail size={18} color="#6E6E78" strokeWidth={2} />
            <input type="email" placeholder="you@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Password</label>
          <div className="input">
            <Lock size={18} color="#2563EB" strokeWidth={2} />
            <input type="password" placeholder="••••••••" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
        </div>
        <div className="text-[12.5px] min-h-4 leading-[1.4]" style={{ color: "#C2456B" }}>
          {msg}
        </div>
        <button className="btn btn-primary tap" onClick={submit} disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </div>

      <div className="flex items-center gap-3 my-6">
        <div className="divider" />
        <span className="dim text-[12px]">or</span>
        <div className="divider" />
      </div>

      <button
        className="btn btn-ghost tap"
        onClick={() => {
          userService.continueAsGuest(name.trim() || undefined);
          toast("Continuing as guest — data stays on this device");
          router.push("/");
        }}
      >
        Continue as guest
      </button>
      {!sbOn && (
        <p className="dim text-[11.5px] text-center mt-3 leading-[1.5]">
          Cloud sync needs Supabase keys (see .env.example). Guest mode keeps everything on-device.
        </p>
      )}
    </div>
  );
}
