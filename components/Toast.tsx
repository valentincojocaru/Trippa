"use client";

/* Imperative toast, ported from the reference `toast()` helper. */

import { useEffect, useState } from "react";

let push: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  push?.(msg);
}

export default function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    push = (m: string) => {
      setMsg(m);
      requestAnimationFrame(() => setOn(true));
      clearTimeout(t1);
      clearTimeout(t2);
      t1 = setTimeout(() => setOn(false), 1900);
      t2 = setTimeout(() => setMsg(null), 2200);
    };
    return () => {
      push = null;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!msg) return null;
  return <div className={"tx-toast" + (on ? " on" : "")}>{msg}</div>;
}
