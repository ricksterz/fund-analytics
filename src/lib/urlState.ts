import { FilterState, Methodology } from "./types";

const METHODOLOGY_VALUES: Methodology[] = [
  "takahashi-alexander",
  "empirical-benchmark",
  "monte-carlo",
  "marshall-lerner",
];

function encodeList(arr: string[]): string {
  return arr.map(encodeURIComponent).join(",");
}

function decodeList(str: string | null): string[] {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => decodeURIComponent(s))
    .filter(Boolean);
}

function decodeRange(str: string | null): [number, number] | null {
  if (!str) return null;
  const [lo, hi] = str.split("-").map(Number);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
  return [lo, hi];
}

interface RangeBounds {
  vintageMin: number;
  vintageMax: number;
  committedMin: number;
  committedMax: number;
}

const DEFAULT_TERM_MIN = 0;
const DEFAULT_TERM_MAX = 10;

/** Serializes the parts of filter state worth putting in a shareable link.
 * Range filters (vintage, committed capital, term) are only included when
 * narrowed from their full bounds -- omitting them at default keeps a
 * single-fund share link down to just `?f=<id>` instead of also carrying
 * every range at its wide-open default (e.g. `&vy=2020-2026&cc=0-50000000000
 * &tm=0-10`), which conveys nothing since a shared link's whole point is
 * the specific fund/methodology/filters someone actually chose. */
export function filtersToSearchParams(filters: FilterState, bounds?: RangeBounds): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.methodology !== "takahashi-alexander") p.set("m", filters.methodology);
  if (!filters.showPME) p.set("pme", "0");
  if (filters.benchmarkReturn !== 0.1) p.set("br", String(filters.benchmarkReturn));
  if (filters.search) p.set("q", filters.search);
  if (filters.fundIds.length) p.set("f", encodeList(filters.fundIds));
  if (filters.managers.length) p.set("mgr", encodeList(filters.managers));
  if (filters.fundTypes.length) p.set("ft", encodeList(filters.fundTypes));
  if (filters.structures.length) p.set("st", encodeList(filters.structures));
  if (filters.states.length) p.set("loc", encodeList(filters.states));

  const vintageNarrowed =
    !bounds || filters.vintageMin !== bounds.vintageMin || filters.vintageMax !== bounds.vintageMax;
  if (vintageNarrowed) p.set("vy", `${filters.vintageMin}-${filters.vintageMax}`);

  const committedNarrowed =
    !bounds || filters.committedMin !== bounds.committedMin || filters.committedMax !== bounds.committedMax;
  if (committedNarrowed) {
    p.set("cc", `${Math.round(filters.committedMin)}-${Math.round(filters.committedMax)}`);
  }

  if (filters.termMin !== DEFAULT_TERM_MIN || filters.termMax !== DEFAULT_TERM_MAX) {
    p.set("tm", `${filters.termMin}-${filters.termMax}`);
  }

  return p;
}

export function searchParamsToFilters(params: URLSearchParams): Partial<FilterState> {
  const partial: Partial<FilterState> = {};

  const m = params.get("m");
  if (m && (METHODOLOGY_VALUES as string[]).includes(m)) partial.methodology = m as Methodology;

  const pme = params.get("pme");
  if (pme === "0") partial.showPME = false;

  const br = params.get("br");
  if (br) {
    const v = Number(br);
    if (Number.isFinite(v)) partial.benchmarkReturn = v;
  }

  const q = params.get("q");
  if (q) partial.search = q;

  const f = decodeList(params.get("f"));
  if (f.length) partial.fundIds = f;

  const mgr = decodeList(params.get("mgr"));
  if (mgr.length) partial.managers = mgr;

  const ft = decodeList(params.get("ft"));
  if (ft.length) partial.fundTypes = ft as FilterState["fundTypes"];

  const st = decodeList(params.get("st"));
  if (st.length) partial.structures = st;

  const loc = decodeList(params.get("loc"));
  if (loc.length) partial.states = loc;

  const vy = decodeRange(params.get("vy"));
  if (vy) [partial.vintageMin, partial.vintageMax] = vy;

  const cc = decodeRange(params.get("cc"));
  if (cc) [partial.committedMin, partial.committedMax] = cc;

  const tm = decodeRange(params.get("tm"));
  if (tm) [partial.termMin, partial.termMax] = tm;

  return partial;
}
