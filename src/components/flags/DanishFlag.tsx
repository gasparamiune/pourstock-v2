import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

/** A Danish pennant flag (🚩-style) with a pole and triangular/rectangular flag */
export function DanishFlag({ className, size = 24 }: FlagProps) {
  const w = size;
  const h = size;
  return (
    <svg
      viewBox="0 0 24 24"
      width={w}
      height={h}
      className={cn("inline-block shrink-0", className)}
      aria-label="Danish flag"
    >
      {/* Pole */}
      <line x1="4" y1="2" x2="4" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Flag body — Danish red */}
      <rect x="5" y="3" width="16" height="12" rx="1" fill="#C8102E" />
      {/* White cross */}
      <rect x="9" y="3" width="3" height="12" fill="#FFFFFF" />
      <rect x="5" y="7.5" width="16" height="3" fill="#FFFFFF" />
    </svg>
  );
}
