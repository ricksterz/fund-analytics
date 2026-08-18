import raw from "./placeCodes.json";

/** SEC EDGAR state/country codes (Form D issuer_state), sourced from the
 * EDGAR filer technical spec reference table. */
const PLACE_CODES: Record<string, string> = raw;

export function placeName(code: string | null): string | null {
  if (!code) return null;
  return PLACE_CODES[code] ?? code;
}

export function placeLabel(code: string | null): string {
  if (!code) return "-";
  const name = PLACE_CODES[code];
  if (!name) return code;
  return name === code ? name : `${name} (${code})`;
}
