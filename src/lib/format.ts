export function formatCurrencyCompact(v: number): string {
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatCurrencyFull(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatPercent(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatMultiple(v: number): string {
  return `${v.toFixed(2)}x`;
}
