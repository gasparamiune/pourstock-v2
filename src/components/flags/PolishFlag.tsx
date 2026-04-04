import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

export function PolishFlag({ className, size = 24 }: FlagProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      aria-label="Polish flag"
    >
      <circle cx="12" cy="12" r="11" fill="#DC143C" />
      <path d="M1,12 A11,11 0 0,1 23,12" fill="#FFFFFF" />
    </svg>
  );
}
