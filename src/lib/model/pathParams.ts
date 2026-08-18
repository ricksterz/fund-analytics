import { clamp, gaussian } from "../rng";
import { CALL_CURVE, DIST_CURVE, TypeAssumptions } from "../assumptions";
import { Methodology, PathYear } from "../types";

export interface PathParams {
  rc: number;
  growth: number;
  yieldRate: number;
  bow: number;
  distStartYear: number;
  investmentPeriod: number;
  callIndex?: (t: number) => number;
  distIndex?: (t: number) => number;
  useEmpiricalCurve?: { callCurve: number[]; distCurve: number[] };
}

/** Shared NAV recursion: NAV(t) = NAV(t-1)*(1+G) + contribution(t) - distribution(t).
 * Contribution/distribution generation differs by methodology; the recursion
 * that turns them into a NAV path is the one thing all four share. Computed
 * per $1 of committed capital -- callers scale by actual committed capital. */
export function simulatePathUnit(term: number, p: PathParams): PathYear[] {
  const years: PathYear[] = [];
  let cumCalled = 0;
  let cumDistributed = 0;
  let nav = 0;
  let cumNet = 0;
  for (let t = 0; t <= term; t++) {
    let contribution = 0;
    let distribution = 0;

    if (p.useEmpiricalCurve) {
      const { callCurve, distCurve } = p.useEmpiricalCurve;
      const cIdx = Math.min(t, callCurve.length - 1);
      const cPrevIdx = Math.max(0, Math.min(t - 1, callCurve.length - 1));
      const dIdx = Math.min(t, distCurve.length - 1);
      const dPrevIdx = Math.max(0, Math.min(t - 1, distCurve.length - 1));
      contribution = t === 0 ? 0 : Math.max(0, callCurve[cIdx] - callCurve[cPrevIdx]);
      distribution = t === 0 ? 0 : Math.max(0, distCurve[dIdx] - distCurve[dPrevIdx]);
      if (p.callIndex) contribution *= p.callIndex(t);
      if (p.distIndex) distribution *= p.distIndex(t);
    } else {
      const rawContribution = t <= p.investmentPeriod ? p.rc * (1 - cumCalled) : 0;
      contribution = Math.max(0, Math.min(rawContribution, 1 - cumCalled));
      if (p.callIndex) contribution *= p.callIndex(t);
      const ramp = clamp((t - p.distStartYear + 1) / 2, 0, 1);
      distribution = t === 0 ? 0 : Math.max(0, p.yieldRate * nav * (1 + p.bow * (t / term)) * ramp);
      if (p.distIndex) distribution *= p.distIndex(t);
    }

    nav = Math.max(0, nav * (1 + p.growth) + contribution - distribution);
    cumCalled += contribution;
    cumDistributed += distribution;
    const netCashFlow = distribution - contribution;
    cumNet += netCashFlow;
    years.push({ contribution, distribution, cumCalled, cumDistributed, nav, netCashFlow, cumNetCashFlow: cumNet });
  }
  return years;
}

function taParams(a: TypeAssumptions, rng: () => number, jitter: boolean): PathParams {
  let { rc, growth, yieldRate, bow } = a;
  if (jitter) {
    rc = clamp(rc + gaussian(rng, 0, rc * 0.18), 0.03, 0.95);
    growth = growth + gaussian(rng, 0, 0.045);
    yieldRate = clamp(yieldRate + gaussian(rng, 0, yieldRate * 0.25), 0.01, 0.6);
    bow = Math.max(0, bow + gaussian(rng, 0, 0.5));
  }
  return { rc, growth, yieldRate, bow, distStartYear: a.distStartYear, investmentPeriod: a.investmentPeriod };
}

function empiricalParams(a: TypeAssumptions, rng: () => number, jitter: boolean): PathParams {
  let growth = a.growth;
  let perfMult = 1;
  let paceMult = 1;
  if (jitter) {
    growth = growth + gaussian(rng, 0, 0.03);
    perfMult = clamp(1 + gaussian(rng, 0, 0.22), 0.4, 2.0);
    paceMult = clamp(1 + gaussian(rng, 0, 0.12), 0.5, 1.6);
  }
  return {
    rc: 0,
    yieldRate: 0,
    bow: 0,
    distStartYear: 0,
    investmentPeriod: 0,
    growth,
    useEmpiricalCurve: { callCurve: CALL_CURVE[a.fundType], distCurve: DIST_CURVE[a.fundType] },
    callIndex: () => paceMult,
    distIndex: () => perfMult,
  };
}

function monteCarloParams(a: TypeAssumptions, rng: () => number): PathParams {
  const rc = clamp(a.rc + gaussian(rng, 0, a.rc * 0.32), 0.02, 0.98);
  const growth = a.growth + gaussian(rng, 0, 0.085);
  const yieldRate = clamp(a.yieldRate + gaussian(rng, 0, a.yieldRate * 0.42), 0.005, 0.75);
  const bow = Math.max(0, a.bow + gaussian(rng, 0, 0.85));
  return { rc, growth, yieldRate, bow, distStartYear: a.distStartYear, investmentPeriod: a.investmentPeriod };
}

/** Base (unjittered) trade-elasticity constants for the Marshall-Lerner
 * adaptation: capital calls respond elastically to a simulated deployment /
 * opportunity index, distributions respond elastically to a simulated
 * exit-liquidity index -- analogous to import/export volumes responding to
 * relative price in the classic trade condition. elasticityCall +
 * elasticityDist > 1 is the model's "condition holds" threshold, i.e. a
 * positive market shock nets out to an improved cumulative cash position
 * rather than a worsened one (the classic M-L logic, relabeled for fund
 * pacing instead of a currency devaluation). */
export const MARSHALL_LERNER_BASE = {
  elasticityCall: 0.65,
  elasticityDist: 0.75,
  amplitudeM: 0.35,
  amplitudeX: 0.4,
  cyclePeriod: 6,
};

function marshallLernerParams(a: TypeAssumptions, rng: () => number, jitter: boolean): PathParams {
  let { rc, growth, yieldRate, bow } = a;
  let elasticityCall = MARSHALL_LERNER_BASE.elasticityCall;
  let elasticityDist = MARSHALL_LERNER_BASE.elasticityDist;
  let amplitudeM = MARSHALL_LERNER_BASE.amplitudeM;
  let amplitudeX = MARSHALL_LERNER_BASE.amplitudeX;
  let phaseM = 0;
  let phaseX = Math.PI / 2;
  let cyclePeriod = MARSHALL_LERNER_BASE.cyclePeriod;
  if (jitter) {
    rc = clamp(rc + gaussian(rng, 0, rc * 0.15), 0.03, 0.9);
    growth = growth + gaussian(rng, 0, 0.035);
    yieldRate = clamp(yieldRate + gaussian(rng, 0, yieldRate * 0.2), 0.01, 0.6);
    bow = Math.max(0, bow + gaussian(rng, 0, 0.4));
    elasticityCall = clamp(elasticityCall + gaussian(rng, 0, 0.25), 0.1, 1.6);
    elasticityDist = clamp(elasticityDist + gaussian(rng, 0, 0.3), 0.1, 1.8);
    amplitudeM = clamp(amplitudeM + gaussian(rng, 0, 0.12), 0.05, 0.6);
    amplitudeX = clamp(amplitudeX + gaussian(rng, 0, 0.12), 0.05, 0.6);
    phaseM = rng() * Math.PI * 2;
    phaseX = rng() * Math.PI * 2;
    cyclePeriod = clamp(cyclePeriod + gaussian(rng, 0, 1.2), 3, 10);
  }
  const marketIndex = (t: number, amp: number, phase: number) =>
    1 + amp * Math.sin((2 * Math.PI * t) / cyclePeriod + phase);
  const callIndex = (t: number) => Math.pow(Math.max(0.05, marketIndex(t, amplitudeM, phaseM)), elasticityCall);
  const distIndex = (t: number) => Math.pow(Math.max(0.05, marketIndex(t, amplitudeX, phaseX)), elasticityDist);
  return {
    rc,
    growth,
    yieldRate,
    bow,
    distStartYear: a.distStartYear,
    investmentPeriod: a.investmentPeriod,
    callIndex,
    distIndex,
  };
}

export function buildPathParams(
  methodology: Methodology,
  a: TypeAssumptions,
  rng: () => number,
  jitter: boolean
): PathParams {
  switch (methodology) {
    case "takahashi-alexander":
      return taParams(a, rng, jitter);
    case "empirical-benchmark":
      return empiricalParams(a, rng, jitter);
    case "monte-carlo":
      return jitter ? monteCarloParams(a, rng) : taParams(a, rng, false);
    case "marshall-lerner":
      return marshallLernerParams(a, rng, jitter);
  }
}

export const SIMULATION_COUNT: Record<Methodology, number> = {
  "takahashi-alexander": 150,
  "empirical-benchmark": 150,
  "monte-carlo": 600,
  "marshall-lerner": 150,
};
