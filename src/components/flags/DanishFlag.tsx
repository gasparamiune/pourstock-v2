import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

export function DanishFlag({ className, size = 24 }: FlagProps) {
  return (
    <svg
      viewBox="0 0 37 28"
      width={size}
      height={size * 28 / 37}
      className={cn("inline-block shrink-0", className)}
      aria-label="Danish flag"
    >
      <rect width="37" height="28" fill="#C8102E" rx="2" />
      <rect x="12" y="0" width="4" height="28" fill="#FFFFFF" />
      <rect x="0" y="12" width="37" height="4" fill="#FFFFFF" />
    </svg>
  );
}
