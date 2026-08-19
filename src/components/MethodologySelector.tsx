"use client";

import { useFilterStore } from "@/store/useFilterStore";
import { Methodology, METHODOLOGIES } from "@/lib/types";
import clsx from "clsx";

const DESCRIPTIONS: Record<Methodology, string> = {
  "takahashi-alexander":
    "Parametric PE cash-flow model (Takahashi & Yale, 2001). Calls a fraction of uncalled commitment each year; distributions are a yield on NAV that back-loads toward harvest via a bow factor.",
  "empirical-benchmark":
    "Industry-style average vintage curves: cumulative % of commitment called and distributed by fund age, drawn from commonly cited PE/VC/credit benchmark shapes rather than a formula.",
  "monte-carlo":
    "Same parametric engine as Takahashi-Alexander, run across a large ensemble of randomized parameter draws (rate of contribution, growth, yield, bow) to quantify outcome uncertainty.",
  "marshall-lerner":
    "Capital calls and distributions are modeled as elastic responses to simulated deployment / exit-liquidity market indices -- adapted from the trade-elasticity condition (ε₁+ε₂>1) so pacing reacts to a cyclical market signal rather than a static schedule.",
};

export function MethodologySelector() {
  const methodology = useFilterStore((s) => s.methodology);
  const setMethodology = useFilterStore((s) => s.setMethodology);
  const showPME = useFilterStore((s) => s.showPME);
  const togglePME = useFilterStore((s) => s.togglePME);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">Methodology</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {METHODOLOGIES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethodology(m.id)}
            className={clsx(
              "text-left rounded-lg border p-3 transition-colors",
              methodology === m.id
                ? "border-teal-400 bg-teal-400/10 ring-1 ring-teal-400/40"
                : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
            )}
          >
            <div
              className={clsx(
                "text-sm font-semibold",
                methodology === m.id ? "text-teal-300" : "text-neutral-200"
              )}
            >
              {m.label}
            </div>
            <div className="mt-1 text-xs text-neutral-500 leading-snug">{DESCRIPTIONS[m.id]}</div>
          </button>
        ))}

        <button
          onClick={togglePME}
          className={clsx(
            // 5 tiles don't divide evenly into the 2-column tablet grid --
            // span both columns there instead of leaving an empty cell
            // dangling next to the last tile.
            "text-left rounded-lg border p-3 transition-colors sm:col-span-2 lg:col-span-1",
            showPME
              ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40"
              : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
          )}
        >
          <div className="flex items-center gap-1.5">
            <div className={clsx("text-sm font-semibold", showPME ? "text-amber-300" : "text-neutral-200")}>
              PME / Direct Alpha
            </div>
            <span className="text-[9px] uppercase tracking-wide rounded-full border border-neutral-700 px-1.5 py-0.5 text-neutral-500">
              overlay
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-500 leading-snug">
            Not a cash-flow model like the four to the left — benchmarks whichever methodology is selected against a
            public market index. Click to show/hide.
          </div>
        </button>
      </div>
    </div>
  );
}
