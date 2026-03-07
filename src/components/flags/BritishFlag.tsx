import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

/** A British pennant flag (matching Danish flag style) with a pole and rectangular flag */
export function BritishFlag({ className, size = 24 }: FlagProps) {
  const w = size;
  const h = size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      className={cn("inline-block shrink-0", className)}
      aria-label="British flag"
    >
      {/* Pole */}
      <line x1="4" y1="2" x2="4" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Flag body — Union Jack blue */}
      <clipPath id="gb-pennant-clip">
        <rect x="5" y="3" width="16" height="12" rx="1" />
      </clipPath>
      <g clipPath="url(#gb-pennant-clip)">
        <rect x="5" y="3" width="16" height="12" fill="#012169" />
        {/* Diagonals white */}
        <line x1="5" y1="3" x2="21" y2="15" stroke="#FFFFFF" strokeWidth="2.5" />
        <line x1="21" y1="3" x2="5" y2="15" stroke="#FFFFFF" strokeWidth="2.5" />
        {/* Diagonals red */}
        <line x1="5" y1="3" x2="21" y2="15" stroke="#C8102E" strokeWidth="1" />
        <line x1="21" y1="3" x2="5" y2="15" stroke="#C8102E" strokeWidth="1" />
        {/* White cross */}
        <rect x="11.5" y="3" width="3" height="12" fill="#FFFFFF" />
        <rect x="5" y="7.5" width="16" height="3" fill="#FFFFFF" />
        {/* Red cross */}
        <rect x="12" y="3" width="2" height="12" fill="#C8102E" />
        <rect x="5" y="8" width="16" height="2" fill="#C8102E" />
      </g>
    </svg>
  );
}
