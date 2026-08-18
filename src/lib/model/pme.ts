import { clamp } from "../rng";
import { Fund, FundType, Methodology, PMEResult } from "../types";
import { getCohortSimulation } from "./engine";

/** Bisection IRR solver: finds r such that sum(amount / (1+r)^t) = 0.
 * Bisection (not Newton) because the modeled cash-flow curves are smooth
 * and monotonic-ish, but a robust root-finder that degrades gracefully
 * (returns null rather than diverging) matters more than speed here --
 * this runs on at most a few dozen aggregated cash-flow points. */
function irrFromCashFlows(flows: { t: number; amount: number }[]): number | null {
  const npv = (r: number) => flows.reduce((s, f) => s + f.amount / Math.pow(1 + r, f.t), 0);
  let lo = -0.95;
  let hi = 5;
  let fLo = npv(lo);
  const fHi = npv(hi);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo === 0) return fLo === 0 ? lo : null;
  if (Math.sign(fLo) === Math.sign(fHi)) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (fMid === 0 || !Number.isFinite(fMid)) return mid;
    if (Math.sign(fMid) === Math.sign(fLo)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/** Kaplan-Schoar PME and Direct Alpha, benchmarking the portfolio's modeled
 * to-date cash flows against a public market index assumed to compound at a
 * constant annual rate. All funds sharing (fundType, vintageYear) have an
 * identical age, so cash flows are aggregated at that cohort level rather
 * than per fund -- exact and far cheaper than a per-fund loop. */
export function computePME(funds: Fund[], methodology: Methodology, benchmarkReturn: number): PMEResult {
  if (funds.length === 0) {
    return { ksPme: 0, directAlpha: null, benchmarkReturn, fvContributions: 0, fvDistributions: 0, navToDate: 0 };
  }

  const groups = new Map<string, { fundType: FundType; vintageYear: number; committed: number }>();
  for (const f of funds) {
    const key = `${f.fundType}|${f.vintageYear}`;
    const g = groups.get(key);
    if (g) g.committed += f.committedCapital;
    else groups.set(key, { fundType: f.fundType, vintageYear: f.vintageYear, committed: f.committedCapital });
  }

  const today = new Date();
  const todayFractionalYear = today.getFullYear() + today.getMonth() / 12 + today.getDate() / 365;

  const flows: { t: number; amount: number }[] = [];
  let navToDate = 0;

  for (const g of groups.values()) {
    const sim = getCohortSimulation(g.fundType, methodology);
    const age = clamp(todayFractionalYear - g.vintageYear, 0, sim.term);
    const path = sim.paths[0];
    const flo = Math.floor(age);
    const frac = age - flo;

    for (let t = 0; t <= flo; t++) {
      const yr = path[t];
      const yearsAgo = age - t;
      if (yr.contribution > 0) flows.push({ t: yearsAgo, amount: -g.committed * yr.contribution });
      if (yr.distribution > 0) flows.push({ t: yearsAgo, amount: g.committed * yr.distribution });
    }
    if (frac > 1e-6 && flo + 1 <= sim.term) {
      const yr = path[flo + 1];
      if (yr.contribution > 0) flows.push({ t: 0, amount: -g.committed * yr.contribution * frac });
      if (yr.distribution > 0) flows.push({ t: 0, amount: g.committed * yr.distribution * frac });
    }
    const hi = Math.min(sim.term, flo + 1);
    const navInterp = path[flo].nav + (path[hi].nav - path[flo].nav) * frac;
    navToDate += g.committed * navInterp;
  }

  flows.push({ t: 0, amount: navToDate });

  let fvContributions = 0;
  let fvDistributions = 0;
  for (const fl of flows) {
    const fv = Math.abs(fl.amount) * Math.pow(1 + benchmarkReturn, fl.t);
    if (fl.amount < 0) fvContributions += fv;
    else fvDistributions += fv;
  }
  const ksPme = fvContributions > 0 ? fvDistributions / fvContributions : 0;

  // Direct Alpha = IRR of the same cash flows after stripping out the
  // index's own compounding -- the resulting rate is the annualized excess
  // return over the benchmark, not an absolute return.
  const deflated = flows.map((fl) => ({ t: fl.t, amount: fl.amount / Math.pow(1 + benchmarkReturn, fl.t) }));
  const directAlpha = irrFromCashFlows(deflated);

  return { ksPme, directAlpha, benchmarkReturn, fvContributions, fvDistributions, navToDate };
}
