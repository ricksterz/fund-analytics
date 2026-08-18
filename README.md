# Fund J-Curve Analytics

A private-fund J-curve analytics dashboard built on real fund identity data
from the SEC Form D pipeline (the same pipeline behind the
[Open Disclosure](https://github.com/ricksterz/advisorapp) app), with
modeled capital-call, distribution, and NAV projections across four
methodologies.

## What's real vs. modeled

**Real, sourced from filings:** fund name, manager, fund type, vintage year,
committed capital, entity structure, and domicile — pulled from 37,425 SEC
Form D pooled-fund offerings (Jan 2025 – Jun 2026 filing window) via
[`scripts/export_funds.py`](scripts/export_funds.py), which dedupes
amendment chains and cleans "indefinite offering" placeholder amounts.

**Modeled, not historical:** Form D reports issuer-side offering amounts
only — it has no capital-call, distribution, or NAV history for any fund.
Every cash-flow, NAV, and return figure in the app is generated client-side
by the selected methodology from type-level assumptions (see
[`src/lib/assumptions.ts`](src/lib/assumptions.ts)):

- **Takahashi–Alexander** — the classic parametric PE cash-flow model
  (Takahashi & Yale, 2001): calls a fraction of uncalled commitment each
  year; distributions are a NAV yield that back-loads via a bow factor.
- **Empirical Benchmarking** — static cumulative-%-called/distributed
  curves by fund age, illustrative of commonly cited PE/VC/credit vintage
  shapes.
- **Stochastic / Monte Carlo** — the same T-A engine run across a large
  (600-path) ensemble of randomized parameter draws to quantify outcome
  uncertainty.
- **Marshall–Lerner Trade Model** — capital calls and distributions modeled
  as elastic responses to simulated deployment / exit-liquidity market
  indices, adapted from the trade-elasticity condition (ε₁+ε₂ > 1).

Every methodology produces a P10–P90 outcome band, not just a single line
(see [`src/lib/model/`](src/lib/model)).

## Refreshing the data

`public/data/funds.json` is a point-in-time export. To refresh it against a
newer local copy of the Open Disclosure DuckDB:

```bash
python3 scripts/export_funds.py
```

Requires `duckdb` (available in `~/dev/advisorapp/.venv`) and read access to
`~/dev/advisorapp/data/advisor.duckdb`.

## Development

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new) —
zero config needed (standard Next.js app).
