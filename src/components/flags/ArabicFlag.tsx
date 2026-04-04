import { cn } from '@/lib/utils';

interface FlagProps {
  className?: string;
  size?: number;
}

/** Saudi Arabia flag as a representative Arabic flag */
export function ArabicFlag({ className, size = 24 }: FlagProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      aria-label="Arabic flag"
    >
      <circle cx="12" cy="12" r="11" fill="#006C35" />
      <text x="12" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontFamily="serif">عربي</text>
    </svg>
  );
}
