"use client";

import { PMEResult } from "@/lib/types";
import { formatMultiple, formatPercent } from "@/lib/format";
import { useFilterStore } from "@/store/useFilterStore";

export function RelativePerformance({ pme }: { pme: PMEResult }) {
  const benchmarkReturn = useFilterStore((s) => s.benchmarkReturn);
  const setBenchmarkReturn = useFilterStore((s) => s.setBenchmarkReturn);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          Relative to Public Markets (PME)
        </h2>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          Benchmark index return
          <input
            type="number"
            step={0.5}
            min={-20}
            max={30}
            value={Math.round(benchmarkReturn * 1000) / 10}
            onChange={(e) => {
              const pct = Number(e.target.value);
              if (Number.isFinite(pct)) setBenchmarkReturn(pct / 100);
            }}
            className="w-16 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-right text-neutral-200 focus:border-teal-400 focus:outline-none"
          />
          <span>%/yr</span>
        </label>
      </div>
      {/* Only ever 2 cards -- no wider column count, or desktop leaves two
          empty trailing cells instead of two appropriately wide ones. */}
      <div className="grid grid-cols-2 gap-2 max-w-2xl">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 flex flex-col gap-1">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">PME (Kaplan-Schoar)</div>
          <div className="text-xl font-semibold text-neutral-100 tabular-nums">{formatMultiple(pme.ksPme)}</div>
          <div className="text-xs text-neutral-500">
            {pme.ksPme >= 1 ? "Ahead of" : "Behind"} a {formatPercent(pme.benchmarkReturn, 0)}/yr index, dollar-weighted
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 flex flex-col gap-1">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">Direct Alpha</div>
          <div className="text-xl font-semibold text-neutral-100 tabular-nums">
            {pme.directAlpha === null
              ? "N/A"
              : `${pme.directAlpha >= 0 ? "+" : ""}${formatPercent(pme.directAlpha)}`}
          </div>
          <div className="text-xs text-neutral-500">
            {pme.directAlpha === null ? "Not enough cash-flow history yet" : "Annualized, vs. index"}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">
        PME compares modeled fund cash flows to the same dollars invested in a public market index compounding at
        the rate above; Direct Alpha is the annualized excess return implied by that comparison. Both use the
        selected methodology&apos;s to-date modeled cash flows, not an actual market index feed.
      </p>
    </div>
  );
}
