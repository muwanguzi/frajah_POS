import { formatUGX, formatCompact } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  compact = false,
  className,
}: CurrencyDisplayProps) {
  const formatted = compact ? formatCompact(amount) : formatUGX(amount);
  return <span className={className}>{formatted}</span>;
}
