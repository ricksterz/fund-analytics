"use client";

import { useMemo, useState } from "react";
import { Fund } from "@/lib/types";
import { termForType } from "@/lib/assumptions";
import { formatCurrencyCompact } from "@/lib/format";
import { placeLabel } from "@/lib/placeCodes";

const INITIAL_ROWS = 15;
const ROW_INCREMENT = 25;

function FundCard({ f }: { f: Fund }) {
  return (
    <div className="rounded-md border border-neutral-800/60 bg-neutral-950/40 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-neutral-200 leading-snug">{f.name}</span>
        <span className="text-sm tabular-nums text-neutral-200 whitespace-nowrap shrink-0">
          {formatCurrencyCompact(f.committedCapital)}
        </span>
      </div>
      <div className="text-xs text-neutral-500 mt-0.5">{f.manager}</div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1.5 text-[11px] text-neutral-500">
        <span>{f.fundType.replace(" Fund", "")}</span>
        <span>·</span>
        <span>{termForType(f.fundType)}y term</span>
        <span>·</span>
        <span>{f.structure}</span>
        <span>·</span>
        <span>{placeLabel(f.state)}</span>
      </div>
    </div>
  );
}

function VintageGroup({
  year,
  funds,
  defaultOpen,
}: {
  year: number;
  funds: Fund[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [visible, setVisible] = useState(INITIAL_ROWS);

  const sorted = useMemo(() => [...funds].sort((a, b) => b.committedCapital - a.committedCapital), [funds]);
  const total = sorted.reduce((s, f) => s + f.committedCapital, 0);
  const rows = sorted.slice(0, visible);

  return (
    <div className="border-b border-neutral-800 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-800/40 text-left"
      >
        <span className="flex items-center gap-2">
          <span className={`text-neutral-500 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          <span className="text-sm font-semibold text-neutral-200">Vintage {year}</span>
          <span className="text-xs text-neutral-500">{sorted.length.toLocaleString()} funds</span>
        </span>
        <span className="text-xs text-neutral-400 tabular-nums">{formatCurrencyCompact(total)} committed</span>
      </button>
      {open && (
        <div>
          <div className="sm:hidden flex flex-col gap-2 p-3">
            {rows.map((f) => (
              <FundCard key={f.id} f={f} />
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-950 text-neutral-500 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-1.5 font-medium">Fund</th>
                <th className="text-left px-3 py-1.5 font-medium">Manager</th>
                <th className="text-left px-3 py-1.5 font-medium">Type</th>
                <th className="text-right px-3 py-1.5 font-medium">Committed Capital</th>
                <th className="text-right px-3 py-1.5 font-medium">Term</th>
                <th className="text-left px-3 py-1.5 font-medium">Structure</th>
                <th className="text-left px-3 py-1.5 font-medium">Domicile</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-t border-neutral-800/60 hover:bg-neutral-800/40">
                  <td className="px-3 py-1.5 text-neutral-200 max-w-[220px] truncate" title={f.name}>
                    {f.name}
                  </td>
                  <td className="px-3 py-1.5 text-neutral-400 max-w-[160px] truncate" title={f.manager}>
                    {f.manager}
                  </td>
                  <td className="px-3 py-1.5 text-neutral-400">{f.fundType.replace(" Fund", "")}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-200">
                    {formatCurrencyCompact(f.committedCapital)}
                    <span className="text-neutral-600 text-[10px] ml-1">
                      {f.capitalBasis === "target" ? "tgt" : "raised"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-400">{termForType(f.fundType)}y</td>
                  <td className="px-3 py-1.5 text-neutral-400">{f.structure}</td>
                  <td className="px-3 py-1.5 text-neutral-400">{placeLabel(f.state)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {visible < sorted.length && (
            <div className="px-3 py-2">
              <button
                onClick={() => setVisible((v) => v + ROW_INCREMENT)}
                className="text-xs text-teal-400 hover:text-teal-300"
              >
                Show {Math.min(ROW_INCREMENT, sorted.length - visible)} more (
                {(sorted.length - visible).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FundExplorer({ funds }: { funds: Fund[] }) {
  const groups = useMemo(() => {
    const byYear = new Map<number, Fund[]>();
    for (const f of funds) {
      const arr = byYear.get(f.vintageYear);
      if (arr) arr.push(f);
      else byYear.set(f.vintageYear, [f]);
    }
    return Array.from(byYear.entries()).sort((a, b) => b[0] - a[0]);
  }, [funds]);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-300">
          Fund Explorer, grouped by vintage{" "}
          <span className="text-neutral-500 font-normal">({funds.length.toLocaleString()} funds)</span>
        </h2>
      </div>
      {groups.length === 0 && (
        <div className="px-3 py-8 text-center text-neutral-500 text-sm">No funds match the current filters.</div>
      )}
      {groups.map(([year, groupFunds], i) => (
        <VintageGroup key={year} year={year} funds={groupFunds} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
