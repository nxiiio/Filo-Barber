export function PoleMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size * 0.55} height={size} viewBox="0 0 18 32" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="pole-mark-clip">
          <rect x="2" y="1" width="14" height="30" rx="7" />
        </clipPath>
      </defs>
      <rect x="2" y="1" width="14" height="30" rx="7" fill="#fff" />
      <g clipPath="url(#pole-mark-clip)">
        <path d="M-4 9 L22 -4 V2 L-4 15Z M-4 23 L22 10 V16 L-4 29Z" fill="var(--color-leather)" />
        <path d="M-4 16 L22 3 V6 L-4 19Z M-4 30 L22 17 V20 L-4 33Z" fill="var(--color-barbicide)" />
      </g>
      <rect x="2" y="1" width="14" height="30" rx="7" fill="none" stroke="var(--color-graphite)" strokeWidth="2" />
    </svg>
  );
}
