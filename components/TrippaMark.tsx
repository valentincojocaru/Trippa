/* Brand mark — white paper plane in flight on the brand gradient
   (#3E7BFF → #5C5BF0 → #9B3FE6), with a dotted trail from the
   departure point. Matches public/logo.svg / the PWA icons. */

export default function TrippaMark({ size = 15 }: { size?: number }) {
  const box = size + 11;
  return (
    <span
      className="tp-mark"
      style={{ width: box, height: box, background: "none" }}
      aria-label="Trippa"
    >
      <svg width={box} height={box} viewBox="0 0 512 512">
        <defs>
          <linearGradient id="tpbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3E7BFF" />
            <stop offset="50%" stopColor="#5C5BF0" />
            <stop offset="100%" stopColor="#9B3FE6" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="140" fill="url(#tpbg)" />
        <circle cx="118" cy="394" r="17" fill="#fff" fillOpacity="0.9" />
        <path
          d="M118 394 C 190 412, 268 386, 302 306"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.6"
          strokeWidth="17"
          strokeLinecap="round"
          strokeDasharray="1 44"
        />
        <g transform="translate(168 100) scale(11.4)">
          <path d="M22 2 L2 9.3 L10.6 13.4 Z" fill="#fff" />
          <path d="M22 2 L15 22 L10.6 13.4 Z" fill="#fff" fillOpacity="0.82" />
          <path d="M22 2 L10.6 13.4 L11.4 16.6 Z" fill="#fff" fillOpacity="0.55" />
        </g>
      </svg>
    </span>
  );
}
