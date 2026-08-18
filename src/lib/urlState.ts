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

/** Serializes the parts of filter state worth putting in a shareable link.
 * `bounds` isn't included -- it's re-derived from the loaded dataset. */
export function filtersToSearchParams(filters: FilterState): URLSearchParams {
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
  p.set("vy", `${filters.vintageMin}-${filters.vintageMax}`);
  p.set("cc", `${Math.round(filters.committedMin)}-${Math.round(filters.committedMax)}`);
  p.set("tm", `${filters.termMin}-${filters.termMax}`);
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
