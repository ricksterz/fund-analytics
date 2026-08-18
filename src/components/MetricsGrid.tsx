"use client";

import { PortfolioMetrics } from "@/lib/types";
import { formatCurrencyCompact, formatMultiple, formatPercent } from "@/lib/format";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 flex flex-col gap-1">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-xl font-semibold text-neutral-100 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function MetricsGrid({ metrics }: { metrics: PortfolioMetrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
      />
    </div>
  );
}
