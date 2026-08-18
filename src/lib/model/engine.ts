import { TYPE_ASSUMPTIONS } from "../assumptions";
import { clamp, hashSeed, mulberry32, percentile } from "../rng";
import { Fund, FundType, Methodology, PathYear, PortfolioMetrics, Projection, YearPoint } from "../types";
import { buildPathParams, SIMULATION_COUNT, simulatePathUnit } from "./pathParams";

interface CohortSimulation {
  paths: PathYear[][]; // paths[0] is the central (unjittered) path
  term: number;
}

const cohortCache = new Map<string, CohortSimulation>();

export function getCohortSimulation(fundType: FundType, methodology: Methodology): CohortSimulation {
  const key = `${fundType}|${methodology}`;
  const cached = cohortCache.get(key);
  if (cached) return cached;

  const a = TYPE_ASSUMPTIONS[fundType];
  const n = SIMULATION_COUNT[methodology];
  const rng = mulberry32(hashSeed(key));

  const paths: PathYear[][] = [simulatePathUnit(a.term, buildPathParams(methodology, a, rng, false))];
  for (let i = 1; i < n; i++) {
    paths.push(simulatePathUnit(a.term, buildPathParams(methodology, a, rng, true)));
  }

  const result: CohortSimulation = { paths, term: a.term };
  cohortCache.set(key, result);
  return result;
}

function emptyMetrics(): PortfolioMetrics {
  return {
    committedCapital: 0,
    capitalCalledToDate: 0,
    capitalDistributedToDate: 0,
    peakNav: 0,
    peakNavP10: 0,
    peakNavP90: 0,
    targetNetIRR: 0,
    dpi: 0,
    tvpi: 0,
    rvpi: 0,
    yr10DistributionLow: 0,
    yr10DistributionHigh: 0,
    yr10Year: 0,
    fundCount: 0,
    navToDate: 0,
  };
}

export function buildProjection(funds: Fund[], methodology: Methodology): Projection {
  if (funds.length === 0) {
    return { methodology, maxTerm: 0, points: [], metrics: emptyMetrics(), simulations: 0 };
  }

  const committedByType = new Map<FundType, number>();
  for (const f of funds) {
    committedByType.set(f.fundType, (committedByType.get(f.fundType) ?? 0) + f.committedCapital);
  }

  const cohorts = Array.from(committedByType.entries()).map(([fundType, committed]) => ({
    fundType,
    committed,
    sim: getCohortSimulation(fundType, methodology),
  }));

  const maxTerm = Math.max(...cohorts.map((c) => c.sim.term));
  const numPaths = SIMULATION_COUNT[methodology];

  const portfolioDraws: PathYear[][] = [];
  for (let i = 0; i < numPaths; i++) {
    const yearArr: PathYear[] = [];
    let cumCalled = 0;
    let cumDistributed = 0;
    let cumNet = 0;
    for (let t = 0; t <= maxTerm; t++) {
      let contribution = 0;
      let distribution = 0;
      let nav = 0;
      for (const c of cohorts) {
        const path = c.sim.paths[i % c.sim.paths.length];
        if (t <= c.sim.term) {
          contribution += c.committed * path[t].contribution;
          distribution += c.committed * path[t].distribution;
          nav += c.committed * path[t].nav;
        } else {
          nav += c.committed * path[c.sim.term].nav;
        }
      }
      cumCalled += contribution;
      cumDistributed += distribution;
      const netCashFlow = distribution - contribution;
      cumNet += netCashFlow;
      yearArr.push({ contribution, distribution, cumCalled, cumDistributed, nav, netCashFlow, cumNetCashFlow: cumNet });
    }
    portfolioDraws.push(yearArr);
  }

  const central = portfolioDraws[0];
  const points: YearPoint[] = [];
  for (let t = 0; t <= maxTerm; t++) {
    const contributions = portfolioDraws.map((d) => d[t].contribution).sort((a, b) => a - b);
    const distributions = portfolioDraws.map((d) => d[t].distribution).sort((a, b) => a - b);
    const cumCalledArr = portfolioDraws.map((d) => d[t].cumCalled).sort((a, b) => a - b);
    const cumDistArr = portfolioDraws.map((d) => d[t].cumDistributed).sort((a, b) => a - b);
    const navArr = portfolioDraws.map((d) => d[t].nav).sort((a, b) => a - b);
    const cumNetArr = portfolioDraws.map((d) => d[t].cumNetCashFlow).sort((a, b) => a - b);

    points.push({
      year: t,
      capitalCalled: central[t].contribution,
      capitalCalledP10: percentile(contributions, 0.1),
      capitalCalledP90: percentile(contributions, 0.9),
      cumulativeCalled: central[t].cumCalled,
      cumulativeCalledP10: percentile(cumCalledArr, 0.1),
      cumulativeCalledP90: percentile(cumCalledArr, 0.9),
      distributions: central[t].distribution,
      distributionsP10: percentile(distributions, 0.1),
      distributionsP90: percentile(distributions, 0.9),
      cumulativeDistributions: central[t].cumDistributed,
      cumulativeDistributionsP10: percentile(cumDistArr, 0.1),
      cumulativeDistributionsP90: percentile(cumDistArr, 0.9),
      netCashFlow: central[t].netCashFlow,
      cumulativeNetCashFlow: central[t].cumNetCashFlow,
      cumulativeNetCashFlowP10: percentile(cumNetArr, 0.1),
      cumulativeNetCashFlowP90: percentile(cumNetArr, 0.9),
      nav: central[t].nav,
      navP10: percentile(navArr, 0.1),
      navP90: percentile(navArr, 0.9),
    });
  }

  const committedCapital = funds.reduce((s, f) => s + f.committedCapital, 0);

  const today = new Date();
  const todayFractionalYear = today.getFullYear() + today.getMonth() / 12 + today.getDate() / 365;

  let capitalCalledToDate = 0;
  let capitalDistributedToDate = 0;
  let navToDate = 0;
  let netIRRWeighted = 0;

  for (const f of funds) {
    const sim = getCohortSimulation(f.fundType, methodology);
    const ageYears = clamp(todayFractionalYear - f.vintageYear, 0, sim.term);
    const lo = Math.floor(ageYears);
    const hi = Math.min(sim.term, Math.ceil(ageYears));
    const frac = ageYears - lo;
    const path = sim.paths[0];
    const interp = (key: "cumCalled" | "cumDistributed" | "nav") =>
      path[lo][key] + (path[hi][key] - path[lo][key]) * frac;

    capitalCalledToDate += f.committedCapital * interp("cumCalled");
    capitalDistributedToDate += f.committedCapital * interp("cumDistributed");
    navToDate += f.committedCapital * interp("nav");

    const a = TYPE_ASSUMPTIONS[f.fundType];
    netIRRWeighted += f.committedCapital * (a.targetGrossIRR - a.feeDrag);
  }

  const targetNetIRR = committedCapital > 0 ? netIRRWeighted / committedCapital : 0;
  const peakNav = Math.max(...points.map((p) => p.nav));
  const peakNavP10 = Math.max(...points.map((p) => p.navP10));
  const peakNavP90 = Math.max(...points.map((p) => p.navP90));
  const yr10Year = Math.min(10, maxTerm);
  const yr10Point = points[yr10Year];

  const dpi = capitalCalledToDate > 0 ? capitalDistributedToDate / capitalCalledToDate : 0;
  const tvpi = capitalCalledToDate > 0 ? (capitalDistributedToDate + navToDate) / capitalCalledToDate : 0;
  const rvpi = capitalCalledToDate > 0 ? navToDate / capitalCalledToDate : 0;

  const metrics: PortfolioMetrics = {
    committedCapital,
    capitalCalledToDate,
    capitalDistributedToDate,
    peakNav,
    peakNavP10,
    peakNavP90,
    targetNetIRR,
    dpi,
    tvpi,
    rvpi,
    yr10DistributionLow: yr10Point.cumulativeDistributionsP10,
    yr10DistributionHigh: yr10Point.cumulativeDistributionsP90,
    yr10Year,
    fundCount: funds.length,
    navToDate,
  };

  return { methodology, maxTerm, points, metrics, simulations: numPaths };
}
