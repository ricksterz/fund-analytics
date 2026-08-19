"use client";

import { YearPoint } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/format";
import clsx from "clsx";

function CashFlowCard({ p, committedCapital }: { p: YearPoint; committedCapital: number }) {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-950/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-neutral-200 text-sm">Year {p.year}</span>
        <span
          className={clsx(
            "text-sm font-semibold tabular-nums",
            p.cumulativeNetCashFlow >= 0 ? "text-emerald-300" : "text-red-300"
          )}
        >
          {formatCurrencyCompact(p.cumulativeNetCashFlow)} cum.
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-neutral-500">Capital Committed</dt>
        <dd className="text-right tabular-nums text-neutral-300">{formatCurrencyCompact(committedCapital)}</dd>

        <dt className="text-neutral-500">Capital Called</dt>
        <dd className="text-right tabular-nums text-red-400">
          {p.capitalCalled > 0 ? `(${formatCurrencyCompact(p.capitalCalled)})` : "-"}
        </dd>

        <dt className="text-neutral-500">Distributions</dt>
        <dd className="text-right tabular-nums text-emerald-400">
          {p.distributions > 0 ? formatCurrencyCompact(p.distributions) : "-"}
        </dd>

        <dt className="text-neutral-500">Distribution Range (P10-P90)</dt>
        <dd className="text-right tabular-nums text-neutral-500">
          {formatCurrencyCompact(p.distributionsP10)} - {formatCurrencyCompact(p.distributionsP90)}
        </dd>

        <dt className="text-neutral-500">Net Cash Flow</dt>
        <dd
          className={clsx(
            "text-right tabular-nums",
            p.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
          )}
        >
          {formatCurrencyCompact(p.netCashFlow)}
        </dd>

        <dt className="text-neutral-500">Projected NAV</dt>
        <dd className="text-right tabular-nums text-purple-300">{formatCurrencyCompact(p.nav)}</dd>
      </dl>
    </div>
  );
}

export function CashFlowTable({ points, committedCapital }: { points: YearPoint[]; committedCapital: number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
      {/* Mobile: stacked cards, one per year -- an 8-column table has no
          honest way to fit a phone screen even with horizontal scroll. */}
      <div className="sm:hidden flex flex-col gap-2 p-3">
        {points.map((p) => (
          <CashFlowCard key={p.year} p={p} committedCapital={committedCapital} />
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-950 text-neutral-400 text-xs uppercase tracking-wide">
              <th className="text-left px-3 py-2 font-medium sticky left-0 bg-neutral-950 whitespace-nowrap">
                Year
              </th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Capital Committed</th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Capital Called</th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Distributions</th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Distribution Range (P10-P90)</th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Net Cash Flow</th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Cumulative Cash Flow</th>
              <th className="text-right px-3 py-2 font-medium whitespace-nowrap">Projected NAV</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.year} className="border-t border-neutral-800 hover:bg-neutral-800/40">
                <td className="px-3 py-2 font-medium text-neutral-200 sticky left-0 bg-neutral-900 whitespace-nowrap">
                  Year {p.year}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-300 whitespace-nowrap">
                  {formatCurrencyCompact(committedCapital)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-red-400 whitespace-nowrap">
                  {p.capitalCalled > 0 ? `(${formatCurrencyCompact(p.capitalCalled)})` : "-"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-400 whitespace-nowrap">
                  {p.distributions > 0 ? formatCurrencyCompact(p.distributions) : "-"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500 whitespace-nowrap">
                  {formatCurrencyCompact(p.distributionsP10)} - {formatCurrencyCompact(p.distributionsP90)}
                </td>
                <td
                  className={clsx(
                    "px-3 py-2 text-right tabular-nums whitespace-nowrap",
                    p.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {formatCurrencyCompact(p.netCashFlow)}
                </td>
                <td
                  className={clsx(
                    "px-3 py-2 text-right tabular-nums font-medium whitespace-nowrap",
                    p.cumulativeNetCashFlow >= 0 ? "text-emerald-300" : "text-red-300"
                  )}
                >
                  {formatCurrencyCompact(p.cumulativeNetCashFlow)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-purple-300 whitespace-nowrap">
                  {formatCurrencyCompact(p.nav)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
