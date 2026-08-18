export type FundType =
  | "Private Equity Fund"
  | "Venture Capital Fund"
  | "Hedge Fund"
  | "Other Investment Fund";

export interface Fund {
  id: string;
  name: string;
  manager: string;
  fundType: FundType;
  vintageYear: number;
  committedCapital: number;
  capitalBasis: "target" | "raised_to_date";
  minInvestment: number | null;
  state: string | null;
  structure: string;
  hasNonAccredited: boolean | null;
  filingCount: number;
  lastFilingDate: string;
  firstFilingDate: string;
}

export type Methodology =
  | "takahashi-alexander"
  | "empirical-benchmark"
  | "monte-carlo"
  | "marshall-lerner";

export const METHODOLOGIES: { id: Methodology; label: string; short: string }[] = [
  { id: "takahashi-alexander", label: "Takahashi–Alexander", short: "T-A" },
  { id: "empirical-benchmark", label: "Empirical Benchmarking", short: "Benchmark" },
  { id: "monte-carlo", label: "Stochastic / Monte Carlo", short: "Monte Carlo" },
  { id: "marshall-lerner", label: "Marshall–Lerner Trade Model", short: "M-L" },
];

/** One year of a single simulated path (pre-aggregation across paths). */
export interface PathYear {
  contribution: number;
  distribution: number;
  cumCalled: number;
  cumDistributed: number;
  nav: number;
  netCashFlow: number;
  cumNetCashFlow: number;
}

/** One year of the aggregated (across N simulated paths) projection band. */
export interface YearPoint {
  year: number;
  capitalCalled: number;
  capitalCalledP10: number;
  capitalCalledP90: number;
  cumulativeCalled: number;
  cumulativeCalledP10: number;
  cumulativeCalledP90: number;
  distributions: number;
  distributionsP10: number;
  distributionsP90: number;
  cumulativeDistributions: number;
  cumulativeDistributionsP10: number;
  cumulativeDistributionsP90: number;
  netCashFlow: number;
  cumulativeNetCashFlow: number;
  cumulativeNetCashFlowP10: number;
  cumulativeNetCashFlowP90: number;
  nav: number;
  navP10: number;
  navP90: number;
}

export interface PortfolioMetrics {
  committedCapital: number;
  capitalCalledToDate: number;
  capitalDistributedToDate: number;
  peakNav: number;
  peakNavP10: number;
  peakNavP90: number;
  targetNetIRR: number;
  dpi: number;
  tvpi: number;
  rvpi: number;
  yr10DistributionLow: number;
  yr10DistributionHigh: number;
  yr10Year: number;
  fundCount: number;
  navToDate: number;
}

export interface Projection {
  methodology: Methodology;
  maxTerm: number;
  points: YearPoint[];
  metrics: PortfolioMetrics;
  simulations: number;
}

export interface FilterState {
  methodology: Methodology;
  search: string;
  fundIds: string[];
  managers: string[];
  fundTypes: FundType[];
  vintageMin: number;
  vintageMax: number;
  committedMin: number;
  committedMax: number;
  termMin: number;
  termMax: number;
  structures: string[];
  states: string[];
}
