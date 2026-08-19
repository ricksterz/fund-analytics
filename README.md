# Vantage Curve

*Every vintage. Every curve. One vantage point.*

A private-fund J-curve analytics dashboard built on real fund identity data
from the SEC Form D pipeline (the same pipeline behind the
[Open Disclosure](https://github.com/ricksterz/advisorapp) app), with
modeled capital-call, distribution, and NAV projections across four
methodologies.

## What's real vs. modeled

**Real, sourced from filings:** fund name, manager, fund type, vintage year,
committed capital, entity structure, and domicile — pulled from 87,553 SEC
Form D pooled-fund offerings, vintages 2020–2026, via
[`scripts/export_funds.py`](scripts/export_funds.py) from two sources:

- **2025–2026** — the Open Disclosure app's DuckDB pipeline, which resolves
  each fund's amendment chain to its latest known filing state.
- **2020–2024** — backfilled directly from SEC's quarterly Form D archives.
  `www.sec.gov` sits behind an Akamai WAF that 403s automated clients (curl,
  requests) even with a spoofed browser User-Agent, so this required
  fetching and parsing each quarterly zip *inside a real browser session*
  (see [`scripts/formd_browser_extractor.js`](scripts/formd_browser_extractor.js),
  cached per-quarter in [`scripts/formd_history/`](scripts/formd_history))
  rather than the usual scripted download. These vintages use each fund's
  original filing only (no cross-quarter amendment-chain resolution), and
  "indefinite offering" placeholder amounts are cleaned the same way as the
  2025–2026 source.

Both sources are further deduplicated: feeder-named funds are dropped
(their cash flows just mirror their master fund's, so counting both
double-counts the same capital), and exact-name matches spanning the
2024/2025 source boundary keep only the more recent entry (the same fund
amending across that boundary previously counted as two).

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

`public/data/funds.json` is a point-in-time export, combining the 2025–2026
DuckDB pull with the cached 2020–2024 backfill in `scripts/formd_history/`:

```bash
python3 scripts/export_funds.py
```

Requires `duckdb` (available in `~/dev/advisorapp/.venv`) and read access to
`~/dev/advisorapp/data/advisor.duckdb`. To pull additional quarters (new
recent ones, or further back than 2020), open a real browser tab on any
`sec.gov` page, paste in `scripts/formd_browser_extractor.js`, and run
`await extractQuarter('<zip url from the Form D Data Sets page>')` — save
the result to a new file under `scripts/formd_history/` and re-run the
export.

## Development

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new) —
zero config needed (standard Next.js app).
