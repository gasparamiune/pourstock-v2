import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

export function DanishFlag({ className, size = 24 }: FlagProps) {
  const r = 11;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      aria-label="Danish flag"
    >
      <clipPath id="dk-circle">
        <circle cx="12" cy="12" r={r} />
      </clipPath>
      <g clipPath="url(#dk-circle)">
        <rect x="0" y="0" width="24" height="24" fill="#C8102E" />
        {/* White cross */}
        <rect x="8" y="0" width="3" height="24" fill="#FFFFFF" />
        <rect x="0" y="9" width="24" height="3" fill="#FFFFFF" />
      </g>
      <circle cx="12" cy="12" r={r} fill="none" stroke="white" strokeWidth="0.3" opacity="0.3" />
    </svg>
  );
}
