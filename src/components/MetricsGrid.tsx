"use client";

import { PortfolioMetrics } from "@/lib/types";
import { formatCurrencyCompact, formatMultiple, formatPercent } from "@/lib/format";
import clsx from "clsx";

function Card({
  label,
  value,
  sub,
  wide,
}: {
  label: string;
  value: string;
  sub?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-neutral-800 bg-neutral-900 p-3 flex flex-col gap-1",
        wide && "col-span-2 sm:col-span-1"
      )}
    >
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-xl font-semibold text-neutral-100 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function MetricsGrid({ metrics }: { metrics: PortfolioMetrics }) {
  // 9 cards -- doesn't divide evenly into 2 (mobile) or 5 (desktop) columns,
  // so we stop at 3 columns (9/3 is exact) and let the last card span the
  // full row on mobile instead of leaving an empty trailing cell.
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <Card label="Committed Capital" value={formatCurrencyCompact(metrics.committedCapital)} sub={`${metrics.fundCount.toLocaleString()} funds`} />
      <Card
        label="Capital Called"
        value={formatCurrencyCompact(metrics.capitalCalledToDate)}
        sub={
          metrics.committedCapital > 0
            ? `${formatPercent(metrics.capitalCalledToDate / metrics.committedCapital)} of committed`
            : undefined
        }
      />
      <Card label="Capital Distributed" value={formatCurrencyCompact(metrics.capitalDistributedToDate)} sub="Cumulative, to date" />
      <Card
        label="Peak NAV"
        value={formatCurrencyCompact(metrics.peakNav)}
        sub={`P10-P90: ${formatCurrencyCompact(metrics.peakNavP10)} - ${formatCurrencyCompact(metrics.peakNavP90)}`}
      />
      <Card label="Target Net IRR" value={formatPercent(metrics.targetNetIRR)} sub="Committed-capital weighted" />
      <Card label="DPI" value={formatMultiple(metrics.dpi)} sub="Distributed / Paid-In" />
      <Card label="TVPI" value={formatMultiple(metrics.tvpi)} sub="Total Value / Paid-In" />
      <Card label="RVPI" value={formatMultiple(metrics.rvpi)} sub="Residual Value / Paid-In" />
      <Card
        label={`Yr ${metrics.yr10Year} Distribution Range`}
        value={`${formatCurrencyCompact(metrics.yr10DistributionLow)} - ${formatCurrencyCompact(metrics.yr10DistributionHigh)}`}
        sub="P10 - P90 cumulative"
        wide
      />
    </div>
  );
}
