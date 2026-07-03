"use client";

/* Reminders — notification center. Auto reminders derived from live
   trip data + custom reminders + local Notifications (features3.js). */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2 } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import Sheet from "@/components/Sheet";
import { toast } from "@/components/Toast";
import { store, useStoreVersion } from "@/lib/store";
import { allReminders, toggleReminderDone, maybeNotify } from "@/lib/reminders";
import type { CustomReminder } from "@/lib/types";

const ICONS: Record<string, string> = {
  plane: "✈️",
  bag: "🧳",
  check: "✅",
  pin: "📍",
  money: "💶",
  bell: "🔔",
};

export default function RemindersPage() {
  const router = useRouter();
  useStoreVersion();
  const [addOpen, setAddOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useState(() => {
    if (typeof window !== "undefined") setTimeout(() => setMounted(true), 0);
  });
  const [, force] = useState(0);

  if (!mounted) return <div className="screen-body" />;

  const list = allReminders();
  const active = list.filter((r) => !r.done);
  const done = list.filter((r) => r.done);
  const perm = "Notification" in window ? Notification.permission : "unsupported";

  async function enablePush() {
    if (!("Notification" in window)) {
      toast("Notifications not supported");
      return;
    }
    let p = Notification.permission;
    if (p !== "granted") p = await Notification.requestPermission();
    if (p === "granted") {
      toast("Notifications on ✓");
      maybeNotify("Trippa reminders on", "We'll nudge you about check-in, packing and your daily plan.");
    } else toast("Notifications blocked");
    force((x) => x + 1);
  }

  const row = (r: (typeof list)[number]) => (
    <div className={"rm-item" + (r.done ? " rm-done" : "") + (r.urgent && !r.done ? " rm-urgent" : "")} key={r.id}>
      <span className={"cbox tap" + (r.done ? " on" : "")} onClick={() => toggleReminderDone(r.id)}>
        {r.done ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
      </span>
      <span className="itile glass2" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 17 }}>
        {ICONS[r.icon] || "🔔"}
      </span>
      <div className="flex-1 tap" onClick={() => r.go && router.push(r.go)} style={{ cursor: r.go ? "pointer" : "default" }}>
        <div className="flex items-center justify-between">
          <b className="text-[13.5px]">{r.title}</b>
          {r.urgent && !r.done ? (
            <span className="badge" style={{ background: "rgba(194,69,107,.14)", color: "#C2456B" }}>
              Now
            </span>
          ) : (
            <span className="dim text-[11px]">{r.sub || ""}</span>
          )}
        </div>
        <div className="muted text-[12.5px] mt-[2px] leading-[1.4]">{r.body || ""}</div>
      </div>
      {!r.auto && (
        <span
          className="ic-btn tap"
          style={{ color: "#C2456B", flex: "0 0 auto" }}
          onClick={() => {
            const arr = store.get<CustomReminder[]>("customRems", []);
            arr.splice(+r.id.slice(1), 1);
            store.set("customRems", arr);
          }}
        >
          <Trash2 size={15} strokeWidth={2} />
        </span>
      )}
    </div>
  );

  return (
    <>
      <ScreenHeader title="Reminders" backHref="/" />
      <div className="screen-body">
        <div
          className="card p-[14px] flex gap-[11px] items-center mb-4"
          style={perm === "granted" ? { background: "rgba(22,163,74,.08)", borderColor: "rgba(22,163,74,.28)" } : undefined}
        >
          <span className="itile" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)" }}>
            <Bell size={19} strokeWidth={2} />
          </span>
          <div className="flex-1">
            <b className="text-[13.5px]">{perm === "granted" ? "Notifications on" : "Turn on reminders"}</b>
            <div className="dim text-[12px] mt-[1px]">
              {perm === "granted"
                ? "We’ll nudge you at the right time."
                : "Get a heads-up for check-in, packing & plans."}
            </div>
          </div>
          {perm !== "granted" && (
            <button className="pill tap" style={{ height: 32, background: "var(--accent)", color: "#fff", border: "none" }} onClick={enablePush}>
              Enable
            </button>
          )}
        </div>

        <div className="sec-lbl mb-2">ACTIVE · {active.length}</div>
        {active.length ? (
          active.map(row)
        ) : (
          <div className="card p-[22px] text-center">
            <b style={{ color: "var(--green)" }}>You&apos;re all caught up ✓</b>
          </div>
        )}
        {done.length > 0 && (
          <>
            <div className="sec-lbl mt-[18px] mb-2">DONE</div>
            {done.map(row)}
          </>
        )}

        <button className="btn btn-primary tap mt-[18px]" onClick={() => setAddOpen(true)}>
          Add a reminder
        </button>
      </div>

      {addOpen && (
        <Sheet
          title="New reminder"
          submitLabel="Add reminder"
          fields={[
            { key: "title", label: "Remind me to…", ph: "e.g. Exchange cash" },
            { key: "body", label: "Note", ph: "optional" },
            { key: "time", label: "When", type: "seg", options: ["Today", "Tomorrow", "Before trip", "On arrival"] },
          ]}
          onClose={(r) => {
            setAddOpen(false);
            if (r && r.title) {
              const arr = store.get<CustomReminder[]>("customRems", []);
              arr.unshift({ title: r.title, body: r.body, time: r.time, done: false });
              store.set("customRems", arr);
              toast("Reminder added");
              maybeNotify(r.title, r.body || "");
            }
          }}
        />
      )}
    </>
  );
}
