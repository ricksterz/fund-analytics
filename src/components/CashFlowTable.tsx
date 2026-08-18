"use client";

import { YearPoint } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/format";
import clsx from "clsx";

export function CashFlowTable({ points, committedCapital }: { points: YearPoint[]; committedCapital: number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-950 text-neutral-400 text-xs uppercase tracking-wide">
              <th className="text-left px-3 py-2 font-medium sticky left-0 bg-neutral-950">Year</th>
              <th className="text-right px-3 py-2 font-medium">Capital Committed</th>
              <th className="text-right px-3 py-2 font-medium">Capital Called</th>
              <th className="text-right px-3 py-2 font-medium">Distributions</th>
              <th className="text-right px-3 py-2 font-medium">Distribution Range (P10-P90)</th>
              <th className="text-right px-3 py-2 font-medium">Net Cash Flow</th>
              <th className="text-right px-3 py-2 font-medium">Cumulative Cash Flow</th>
              <th className="text-right px-3 py-2 font-medium">Projected NAV</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.year} className="border-t border-neutral-800 hover:bg-neutral-800/40">
                <td className="px-3 py-2 font-medium text-neutral-200 sticky left-0 bg-neutral-900">
                  Year {p.year}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-300">
                  {formatCurrencyCompact(committedCapital)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-red-400">
                  {p.capitalCalled > 0 ? `(${formatCurrencyCompact(p.capitalCalled)})` : "-"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-400">
                  {p.distributions > 0 ? formatCurrencyCompact(p.distributions) : "-"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                  {formatCurrencyCompact(p.distributionsP10)} - {formatCurrencyCompact(p.distributionsP90)}
                </td>
                <td
                  className={clsx(
                    "px-3 py-2 text-right tabular-nums",
                    p.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {formatCurrencyCompact(p.netCashFlow)}
                </td>
                <td
                  className={clsx(
                    "px-3 py-2 text-right tabular-nums font-medium",
                    p.cumulativeNetCashFlow >= 0 ? "text-emerald-300" : "text-red-300"
                  )}
                >
                  {formatCurrencyCompact(p.cumulativeNetCashFlow)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-purple-300">
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
