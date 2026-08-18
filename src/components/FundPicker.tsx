"use client";

import { useMemo, useState } from "react";
import { Fund } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/format";

export function FundPicker({
  funds,
  selectedIds,
  onToggle,
  onClear,
}: {
  funds: Fund[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const byId = useMemo(() => new Map(funds.map((f) => [f.id, f])), [funds]);
  const selectedFunds = selectedIds.map((id) => byId.get(id)).filter((f): f is Fund => !!f);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: Fund[] = [];
    for (const f of funds) {
      if (f.name.toLowerCase().includes(q) || f.manager.toLowerCase().includes(q)) {
        results.push(f);
        if (results.length >= 400) break;
      }
    }
    return results.sort((a, b) => b.committedCapital - a.committedCapital).slice(0, 30);
  }, [funds, query]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-neutral-400">Fund (search &amp; select)</label>
        {selectedIds.length > 0 && (
          <button onClick={onClear} className="text-[11px] text-teal-400 hover:text-teal-300">
            Clear {selectedIds.length} selected
          </button>
        )}
      </div>
      <input
        type="text"
        value={query}
        placeholder="Type a fund or manager name to search 37K+ funds..."
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-teal-400 focus:outline-none"
      />

      {selectedFunds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedFunds.map((f) => (
            <button
              key={f.id}
              onClick={() => onToggle(f.id)}
              className="text-[11px] rounded-full bg-teal-400/15 text-teal-300 px-2 py-0.5 hover:bg-teal-400/25 max-w-[220px] truncate"
              title={f.name}
            >
              {f.name} ×
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && (
        <div className="absolute z-20 mt-1 w-full min-w-[340px] rounded-md border border-neutral-700 bg-neutral-900 shadow-lg max-h-72 overflow-y-auto">
          {matches.length === 0 && <div className="px-3 py-2 text-xs text-neutral-500">No matches</div>}
          {matches.map((f) => (
            <label
              key={f.id}
              className="flex items-start gap-2 px-3 py-2 text-sm hover:bg-neutral-800 cursor-pointer border-b border-neutral-800/60 last:border-0"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(f.id)}
                onChange={() => onToggle(f.id)}
                className="accent-teal-400 mt-0.5"
              />
              <span className="flex-1 min-w-0">
                <span className="block truncate text-neutral-200">{f.name}</span>
                <span className="block truncate text-xs text-neutral-500">
                  {f.manager} · {f.fundType.replace(" Fund", "")} · Vintage {f.vintageYear} ·{" "}
                  {formatCurrencyCompact(f.committedCapital)}
                </span>
              </span>
            </label>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 py-1.5 border-t border-neutral-800 sticky bottom-0 bg-neutral-900"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
