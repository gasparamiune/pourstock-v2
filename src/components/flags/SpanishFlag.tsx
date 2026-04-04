import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

export function SpanishFlag({ className, size = 24 }: FlagProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      aria-label="Spanish flag"
    >
      <circle cx="12" cy="12" r="11" fill="#AA151B" />
      <rect x="1" y="8" width="22" height="8" fill="#F1BF00" />
    </svg>
  );
}
