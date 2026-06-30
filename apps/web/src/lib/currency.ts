export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-UG').format(value);
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `UGX ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `UGX ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatUGX(amount);
}
