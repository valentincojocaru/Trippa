/* Brand mark — white "T" with plane/swoosh on the brand gradient. */

export default function TrippaMark({ size = 15 }: { size?: number }) {
  return (
    <span
      className="tp-mark"
      style={{ width: size + 11, height: size + 11 }}
      aria-label="Trippa"
    >
      <svg width={size} height={size} viewBox="0 0 120 120">
        <rect x="31" y="33" width="58" height="15" rx="7" fill="#fff" />
        <rect x="52" y="39" width="16" height="49" rx="5" fill="#fff" />
        <path d="M38 82 Q59 92 79 61" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g transform="translate(72,44) scale(1.5)">
          <path
            d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.5 6.7c-.5-.1-.9.1-1.1.4L3 9.5l5 3-3.5 5L7 18l3-2 3 3 1.5-1.5c.3-.2.5-.6.4-1.1z"
            fill="#fff"
          />
        </g>
      </svg>
    </span>
  );
}
