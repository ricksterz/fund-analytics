import { FundType } from "./types";

/** Default modeling assumptions by fund strategy. Form D / ADV data has no
 * actual capital-call, distribution, or NAV history, so every downstream
 * cash-flow projection is a MODELED estimate driven by these type-level
 * assumptions -- real fund identity (name, manager, committed capital,
 * vintage) is the only part sourced from filings. */
export interface TypeAssumptions {
  fundType: FundType;
  term: number; // fund life, years (evergreen funds get an evaluation horizon)
  investmentPeriod: number; // years capital is actively called
  distStartYear: number; // first year distributions begin
  rc: number; // Takahashi-Alexander rate of contribution
  growth: number; // annual NAV appreciation (G)
  yieldRate: number; // annual distribution yield on NAV (Y)
  bow: number; // back-loading factor for distributions
  targetGrossIRR: number;
  feeDrag: number; // gross -> net IRR haircut (fees + carry)
  isEvergreen: boolean;
}

export const TYPE_ASSUMPTIONS: Record<FundType, TypeAssumptions> = {
  "Private Equity Fund": {
    fundType: "Private Equity Fund",
    term: 10,
    investmentPeriod: 5,
    distStartYear: 3,
    rc: 0.3,
    growth: 0.13,
    yieldRate: 0.17,
    bow: 2.4,
    targetGrossIRR: 0.2,
    feeDrag: 0.035,
    isEvergreen: false,
  },
  "Venture Capital Fund": {
    fundType: "Venture Capital Fund",
    term: 10,
    investmentPeriod: 5,
    distStartYear: 4,
    rc: 0.24,
    growth: 0.18,
    yieldRate: 0.13,
    bow: 3.2,
    targetGrossIRR: 0.25,
    feeDrag: 0.03,
    isEvergreen: false,
  },
  "Other Investment Fund": {
    fundType: "Other Investment Fund",
    term: 8,
    investmentPeriod: 3,
    distStartYear: 2,
    rc: 0.4,
    growth: 0.08,
    yieldRate: 0.21,
    bow: 1.3,
    targetGrossIRR: 0.12,
    feeDrag: 0.025,
    isEvergreen: false,
  },
  "Hedge Fund": {
    fundType: "Hedge Fund",
    term: 5,
    investmentPeriod: 1,
    distStartYear: 1,
    rc: 1.0,
    growth: 0.09,
    yieldRate: 0.09,
    bow: 0.0,
    targetGrossIRR: 0.1,
    feeDrag: 0.02,
    isEvergreen: true,
  },
};

/** Empirical-benchmark cumulative % of committed capital called / distributed
 * by fund age, illustrative of commonly-cited industry J-curve shapes
 * (Cambridge Associates / Preqin style average vintage curves). Index = year. */
export const CALL_CURVE: Record<FundType, number[]> = {
  "Private Equity Fund": [0, 0.22, 0.46, 0.65, 0.79, 0.88, 0.93, 0.96, 0.98, 0.99, 1, 1, 1],
  "Venture Capital Fund": [0, 0.18, 0.37, 0.56, 0.72, 0.84, 0.91, 0.95, 0.98, 0.99, 1, 1, 1],
  "Other Investment Fund": [0, 0.36, 0.61, 0.79, 0.9, 0.96, 0.99, 1, 1, 1, 1, 1, 1],
  "Hedge Fund": [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export const DIST_CURVE: Record<FundType, number[]> = {
  "Private Equity Fund": [0, 0, 0.03, 0.1, 0.22, 0.38, 0.58, 0.8, 1.05, 1.28, 1.48, 1.62, 1.72],
  "Venture Capital Fund": [0, 0, 0.02, 0.06, 0.14, 0.26, 0.45, 0.7, 1.0, 1.35, 1.65, 1.9, 2.1],
  "Other Investment Fund": [0, 0.05, 0.15, 0.3, 0.48, 0.66, 0.84, 1.0, 1.14, 1.24, 1.32, 1.38, 1.42],
  "Hedge Fund": [0, 0.09, 0.19, 0.3, 0.42, 0.55, 0.69, 0.84, 1.0, 1.17, 1.35, 1.54, 1.74],
};

export function termForType(fundType: FundType): number {
  return TYPE_ASSUMPTIONS[fundType].term;
}
