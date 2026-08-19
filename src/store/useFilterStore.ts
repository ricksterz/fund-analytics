"use client";

import { create } from "zustand";
import { termForType } from "@/lib/assumptions";
import { FilterState, Fund, FundType, Methodology } from "@/lib/types";

interface FilterStore extends FilterState {
  bounds: {
    vintageMin: number;
    vintageMax: number;
    committedMin: number;
    committedMax: number;
    managers: string[];
    structures: string[];
    states: string[];
  };
  boundsInitialized: boolean;
  initBounds: (funds: Fund[]) => void;
  setMethodology: (m: Methodology) => void;
  togglePME: () => void;
  setBenchmarkReturn: (r: number) => void;
  setSearch: (s: string) => void;
  toggleFund: (id: string) => void;
  clearFunds: () => void;
  toggleManager: (m: string) => void;
  setManagers: (m: string[]) => void;
  toggleFundType: (t: FundType) => void;
  setVintageRange: (min: number, max: number) => void;
  setCommittedRange: (min: number, max: number) => void;
  setTermRange: (min: number, max: number) => void;
  toggleStructure: (s: string) => void;
  toggleState: (s: string) => void;
  setFundIds: (ids: string[]) => void;
  hydrate: (partial: Partial<FilterState>) => void;
  reset: () => void;
}

const DEFAULTS: FilterState = {
  methodology: "takahashi-alexander",
  showPME: true,
  benchmarkReturn: 0.1,
  search: "",
  fundIds: [],
  managers: [],
  fundTypes: [],
  vintageMin: 2000,
  vintageMax: 2030,
  committedMin: 0,
  committedMax: 50_000_000_000,
  termMin: 0,
  termMax: 10,
  structures: [],
  states: [],
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...DEFAULTS,
  bounds: {
    vintageMin: 2000,
    vintageMax: 2030,
    committedMin: 0,
    committedMax: 50_000_000_000,
    managers: [],
    structures: [],
    states: [],
  },
  boundsInitialized: false,
  initBounds: (funds) => {
    if (get().boundsInitialized || funds.length === 0) return;
    let vintageMin = Infinity;
    let vintageMax = -Infinity;
    let committedMin = Infinity;
    let committedMax = -Infinity;
    const managerTotals = new Map<string, number>();
    const structureCounts = new Map<string, number>();
    const stateCounts = new Map<string, number>();
    for (const f of funds) {
      vintageMin = Math.min(vintageMin, f.vintageYear);
      vintageMax = Math.max(vintageMax, f.vintageYear);
      committedMin = Math.min(committedMin, f.committedCapital);
      committedMax = Math.max(committedMax, f.committedCapital);
      managerTotals.set(f.manager, (managerTotals.get(f.manager) ?? 0) + f.committedCapital);
      structureCounts.set(f.structure, (structureCounts.get(f.structure) ?? 0) + 1);
      if (f.state) stateCounts.set(f.state, (stateCounts.get(f.state) ?? 0) + 1);
    }
    // Sort by frequency, not alphabetically -- state codes like "1Z"
    // (Russia) or "2H" (Ukraine) sort before every US state alphabetically
    // despite being a handful of filings out of tens of thousands, which
    // put rare/tiny-count options ahead of the common ones in the dropdown.
    const byCountDesc = (m: Map<string, number>) =>
      Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k);
    const managers = byCountDesc(managerTotals);
    set({
      bounds: {
        vintageMin,
        vintageMax,
        committedMin,
        committedMax,
        managers,
        structures: byCountDesc(structureCounts),
        states: byCountDesc(stateCounts),
      },
      vintageMin,
      vintageMax,
      committedMin,
      committedMax,
      boundsInitialized: true,
    });
  },
  setMethodology: (methodology) => set({ methodology }),
  togglePME: () => set((s) => ({ showPME: !s.showPME })),
  setBenchmarkReturn: (benchmarkReturn) => set({ benchmarkReturn }),
  setSearch: (search) => set({ search }),
  toggleFund: (id) =>
    set((s) => ({
      fundIds: s.fundIds.includes(id) ? s.fundIds.filter((x) => x !== id) : [...s.fundIds, id],
    })),
  clearFunds: () => set({ fundIds: [] }),
  toggleManager: (m) =>
    set((s) => ({
      managers: s.managers.includes(m) ? s.managers.filter((x) => x !== m) : [...s.managers, m],
    })),
  setManagers: (managers) => set({ managers }),
  toggleFundType: (t) =>
    set((s) => ({
      fundTypes: s.fundTypes.includes(t) ? s.fundTypes.filter((x) => x !== t) : [...s.fundTypes, t],
    })),
  setVintageRange: (vintageMin, vintageMax) => set({ vintageMin, vintageMax }),
  setCommittedRange: (committedMin, committedMax) => set({ committedMin, committedMax }),
  setTermRange: (termMin, termMax) => set({ termMin, termMax }),
  toggleStructure: (s2) =>
    set((s) => ({
      structures: s.structures.includes(s2) ? s.structures.filter((x) => x !== s2) : [...s.structures, s2],
    })),
  toggleState: (s2) =>
    set((s) => ({
      states: s.states.includes(s2) ? s.states.filter((x) => x !== s2) : [...s.states, s2],
    })),
  setFundIds: (fundIds) => set({ fundIds }),
  hydrate: (partial) => set(partial),
  reset: () =>
    set((s) => ({
      ...DEFAULTS,
      methodology: s.methodology,
      vintageMin: s.bounds.vintageMin,
      vintageMax: s.bounds.vintageMax,
      committedMin: s.bounds.committedMin,
      committedMax: s.bounds.committedMax,
    })),
}));

export function filterFunds(funds: Fund[], filters: FilterState): Fund[] {
  const search = filters.search.trim().toLowerCase();
  return funds.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search) && !f.manager.toLowerCase().includes(search)) {
      return false;
    }
    if (filters.fundIds.length > 0 && !filters.fundIds.includes(f.id)) return false;
    if (filters.managers.length > 0 && !filters.managers.includes(f.manager)) return false;
    if (filters.fundTypes.length > 0 && !filters.fundTypes.includes(f.fundType)) return false;
    if (f.vintageYear < filters.vintageMin || f.vintageYear > filters.vintageMax) return false;
    if (f.committedCapital < filters.committedMin || f.committedCapital > filters.committedMax) return false;
    const term = termForType(f.fundType);
    if (term < filters.termMin || term > filters.termMax) return false;
    if (filters.structures.length > 0 && !filters.structures.includes(f.structure)) return false;
    if (filters.states.length > 0 && (!f.state || !filters.states.includes(f.state))) return false;
    return true;
  });
}
