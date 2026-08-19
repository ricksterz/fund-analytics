function roundedLocale(v: number, digits: number): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Compact currency with a trillion tier and comma-separated, rounded
 * digits at every tier -- without the T tier, portfolio-scale aggregates
 * (tens of trillions of committed capital across 95K+ funds) rendered as
 * ugly, hard-to-read values like "$10719.17B" instead of "$10.72T". */
export function formatCurrencyCompact(v: number): string {
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${sign}$${roundedLocale(abs / 1e12, 2)}T`;
  if (abs >= 1e9) return `${sign}$${roundedLocale(abs / 1e9, 2)}B`;
  if (abs >= 1e6) return `${sign}$${roundedLocale(abs / 1e6, 1)}M`;
  if (abs >= 1e3) return `${sign}$${roundedLocale(abs / 1e3, 0)}K`;
  return `${sign}$${roundedLocale(abs, 0)}`;
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
