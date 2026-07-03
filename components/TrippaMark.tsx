/* Brand mark — premium "T" with the jet breaking out top-right, on the
   brand gradient (#3E7BFF → #5C5BF0 → #9B3FE6). Simplified from
   public/logo.svg for small sizes: the thin orbit trail is dropped so
   the mark stays crisp at 15–26px. */

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
        {/* the T, nudged left to make room for the jet */}
        <path
          d="M112 138 h224 a26 26 0 0 1 26 26 v14 a26 26 0 0 1 -26 26 h-76 v182 a26 26 0 0 1 -26 26 h-20 a26 26 0 0 1 -26 -26 v-182 h-76 a26 26 0 0 1 -26 -26 v-14 a26 26 0 0 1 26 -26 z"
          fill="#fff"
        />
        {/* trail stub + jet, top-right */}
        <path
          d="M306 302 C 340 292, 366 268, 380 234"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.7"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray="1 42"
        />
        <g transform="translate(404 176) rotate(42) scale(4.6)">
          <path
            d="M21.5 15.5v-2l-8-5V3a1.5 1.5 0 0 0-3 0v5.5l-8 5v2l8-2.5v5.5l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-5.5l8 2.5z"
            fill="#fff"
            transform="translate(-12 -12)"
          />
        </g>
      </svg>
    </span>
  );
}
