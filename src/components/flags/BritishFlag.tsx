import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

export function BritishFlag({ className, size = 24 }: FlagProps) {
  return (
    <svg
      viewBox="0 0 60 30"
      width={size}
      height={size * 30 / 60}
      className={cn("inline-block shrink-0", className)}
      aria-label="British flag"
    >
      <clipPath id="gb-clip">
        <rect width="60" height="30" rx="2" />
      </clipPath>
      <g clipPath="url(#gb-clip)">
        <rect width="60" height="30" fill="#012169" />
        {/* Diagonals */}
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30" stroke="#C8102E" strokeWidth="2" />
        <path d="M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
        {/* Cross */}
        <rect x="25" y="0" width="10" height="30" fill="#FFFFFF" />
        <rect x="0" y="10" width="60" height="10" fill="#FFFFFF" />
        <rect x="27" y="0" width="6" height="30" fill="#C8102E" />
        <rect x="0" y="12" width="60" height="6" fill="#C8102E" />
      </g>
    </svg>
  );
}
