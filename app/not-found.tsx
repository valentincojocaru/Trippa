import Link from "next/link";

/* Branded 404 — a bad URL should still feel like Trippa, not a raw stack. */

export default function NotFound() {
  return (
    <div className="screen-body items-center justify-center text-center" style={{ minHeight: "100dvh" }}>
      <div className="itile acc" style={{ width: 72, height: 72, borderRadius: 24, fontSize: 32 }} aria-hidden>
        🧭
      </div>
      <h1 className="text-[26px] mt-4">Off the map</h1>
      <p className="muted text-[14px] leading-[1.55] mt-2 max-w-[300px]">
        We couldn&apos;t find that page. Let&apos;s get you back on route.
      </p>
      <div className="w-full flex flex-col gap-[10px] mt-6" style={{ maxWidth: 300 }}>
        <Link href="/" className="btn btn-primary tap" style={{ textDecoration: "none" }}>
          Back home
        </Link>
        <Link href="/plan" className="btn btn-ghost tap" style={{ textDecoration: "none" }}>
          Plan a trip
        </Link>
      </div>
    </div>
  );
}
