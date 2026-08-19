"use client";

import { useFilterStore } from "@/store/useFilterStore";
import { FundType } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/format";
import { placeLabel } from "@/lib/placeCodes";
import { MultiSelectSearch } from "./MultiSelectSearch";
import { FundPicker } from "./FundPicker";
import { useFunds } from "@/lib/useFunds";
import clsx from "clsx";

const FUND_TYPES: FundType[] = ["Private Equity Fund", "Venture Capital Fund", "Hedge Fund", "Other Investment Fund"];
const TERMS = [5, 8, 10];

export function FilterBar() {
  const s = useFilterStore();
  const { funds } = useFunds();

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-3">Global Filters</h2>

      <div className="mb-3">
        <FundPicker funds={funds} selectedIds={s.fundIds} onToggle={s.toggleFund} onClear={s.clearFunds} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1 block">Broad Fund / Manager Search</label>
          <input
            type="text"
            value={s.search}
            onChange={(e) => s.setSearch(e.target.value)}
            placeholder="Narrows the Fund Explorer & picker..."
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-teal-400 focus:outline-none"
          />
        </div>

        <MultiSelectSearch
          label="Fund Manager"
          options={s.bounds.managers}
          selected={s.managers}
          onToggle={s.toggleManager}
          placeholder="Filter managers..."
        />

        <MultiSelectSearch
          label="Fund Domicile State"
          options={s.bounds.states}
          selected={s.states}
          onToggle={s.toggleState}
          placeholder="Filter states..."
          renderLabel={placeLabel}
        />

        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1 block">Structure</label>
          <div className="flex flex-wrap gap-1.5">
            {s.bounds.structures.map((st) => (
              <button
                key={st}
                onClick={() => s.toggleStructure(st)}
                className={clsx(
                  "text-xs rounded-full px-2.5 py-1 border",
                  s.structures.includes(st)
                    ? "border-teal-400 bg-teal-400/15 text-teal-300"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1 block">Fund Type / Model Strategy</label>
          <div className="flex flex-wrap gap-1.5">
            {FUND_TYPES.map((ft) => (
              <button
                key={ft}
                onClick={() => s.toggleFundType(ft)}
                className={clsx(
                  "text-xs rounded-full px-2.5 py-1 border",
                  s.fundTypes.includes(ft)
                    ? "border-teal-400 bg-teal-400/15 text-teal-300"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                )}
              >
                {ft}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1 block">
            Vintage Year: {s.vintageMin} - {s.vintageMax}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={s.vintageMin}
              onChange={(e) => s.setVintageRange(Number(e.target.value), s.vintageMax)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-200 focus:border-teal-400 focus:outline-none"
            />
            <span className="text-neutral-600">–</span>
            <input
              type="number"
              value={s.vintageMax}
              onChange={(e) => s.setVintageRange(s.vintageMin, Number(e.target.value))}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-200 focus:border-teal-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1 block">
            Committed Capital: {formatCurrencyCompact(s.committedMin)} – {formatCurrencyCompact(s.committedMax)}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={s.bounds.committedMax}
              step={100_000}
              value={s.committedMin}
              onChange={(e) => s.setCommittedRange(Number(e.target.value), s.committedMax)}
              className="w-full accent-teal-400"
            />
            <input
              type="range"
              min={0}
              max={s.bounds.committedMax}
              step={100_000}
              value={s.committedMax}
              onChange={(e) => s.setCommittedRange(s.committedMin, Number(e.target.value))}
              className="w-full accent-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1 block">
            Fund Term (yrs): {s.termMin} - {s.termMax}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TERMS.map((t) => {
              const active = t >= s.termMin && t <= s.termMax;
              return (
                <button
                  key={t}
                  onClick={() => {
                    const included = TERMS.filter((x) => (x >= s.termMin && x <= s.termMax) || x === t);
                    if (active && TERMS.filter((x) => x >= s.termMin && x <= s.termMax).length > 1) {
                      const remaining = TERMS.filter((x) => (x >= s.termMin && x <= s.termMax) && x !== t);
                      s.setTermRange(Math.min(...remaining), Math.max(...remaining));
                    } else {
                      s.setTermRange(Math.min(...included), Math.max(...included));
                    }
                  }}
                  className={clsx(
                    "text-xs rounded-full px-2.5 py-1 border",
                    active
                      ? "border-teal-400 bg-teal-400/15 text-teal-300"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  )}
                >
                  {t} yr
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={s.reset}
          className="text-xs rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
