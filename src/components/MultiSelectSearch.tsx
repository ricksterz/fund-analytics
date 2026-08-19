"use client";

import { useMemo, useRef, useState } from "react";
import { useClickOutside } from "@/lib/useClickOutside";

export function MultiSelectSearch({
  label,
  options,
  selected,
  onToggle,
  placeholder = "Search...",
  maxVisible = 8,
  renderLabel,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder?: string;
  maxVisible?: number;
  renderLabel?: (v: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const display = renderLabel ?? ((v: string) => v);

  useClickOutside(containerRef, () => setOpen(false), open);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? options.filter((o) => o.toLowerCase().includes(q) || display(o).toLowerCase().includes(q))
      : options;
    return base.slice(0, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-neutral-400">{label}</label>
        {selected.length > 0 && (
          <span className="text-[11px] text-teal-400">{selected.length} selected</span>
        )}
      </div>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-teal-400 focus:outline-none"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 shadow-lg max-h-64 overflow-y-auto">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 border-b border-neutral-800">
              {selected.map((s) => (
                <button
                  key={s}
                  onClick={() => onToggle(s)}
                  className="text-[11px] rounded-full bg-teal-400/15 text-teal-300 px-2 py-0.5 hover:bg-teal-400/25"
                >
                  {display(s)} ×
                </button>
              ))}
            </div>
          )}
          {filtered.slice(0, maxVisible * 5).map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() => onToggle(o)}
                className="accent-teal-400"
              />
              <span className="truncate">{display(o)}</span>
            </label>
          ))}
          {filtered.length === 0 && <div className="px-2 py-2 text-xs text-neutral-500">No matches</div>}
          <button
            onClick={() => setOpen(false)}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 py-1.5 border-t border-neutral-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
