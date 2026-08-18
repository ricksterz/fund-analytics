"""Export pooled-fund Form D offerings from the Open Disclosure advisorapp
DuckDB into a compact JSON dataset for the fund analytics app.

Source: ~/dev/advisorapp/data/advisor.duckdb, table form_d_offerings
(etl/form_d.py in that repo). Form D reports issuer-side exempt-offering
filings (SEC quarterly structured data sets) -- it has NO capital-call,
distribution, or NAV history. What it DOES give us, per offering:
  - issuer_name, investment_fund_type, entity_type, issuer_state
  - filing_date, submission_type (D / D/A), previous_accession_number
  - total_offering_amount (target raise, 35% coverage; often "indefinite")
  - total_amount_sold (cumulative amount actually raised, 100% coverage)

This script:
  1. Loads pooled-fund offerings (is_pooled_fund = true).
  2. Walks amendment chains (previous_accession_number) to find each
     offering's root filing and its most recent state.
  3. Derives: vintage_year (root filing year), committed_capital (target
     offering amount when plausible, else amount raised to date),
     manager (heuristic strip of fund-designator suffixes from issuer_name).
  4. Cleans obvious "indefinite offering" placeholder amounts (offering
     amount wildly larger than amount sold).
  5. Writes public/data/funds.json -- fund identity/economics only.
     All capital-call/distribution/NAV projections are computed client-side
     by the modeling engine (lib/model/*), NOT sourced from filings, since
     no such data exists in Form D or ADV Schedule D.
"""

import json
import math
import re
from pathlib import Path

import duckdb


def _clean(v):
    """Convert pandas/numpy NaN (and NaT) to None; pass everything else through."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    try:
        if v != v:  # NaT and other NaN-likes fail equality with themselves
            return None
    except Exception:
        pass
    return v

ADVISORAPP_DB = Path.home() / "dev/advisorapp/data/advisor.duckdb"
OUT_PATH = Path(__file__).resolve().parent.parent / "public/data/funds.json"

# An offering amount more than this multiple of amount-sold, or above this
# absolute ceiling, is almost certainly an "indefinite" placeholder rather
# than a real target commitment (verified against real 2025-26 filings,
# e.g. several funds reporting $49.9B target against a $40M raise).
MAX_PLAUSIBLE_TARGET = 30_000_000_000
MAX_TARGET_TO_SOLD_RATIO = 25

FUND_DESIGNATOR_RE = re.compile(
    r"""
    \s*[-,]?\s*
    (
        \bFund\b.*|                       # "... Fund XVI-A, L.P."
        \b[IVXL]{1,6}(-[A-Z])?\b.*|        # trailing roman numerals "... IX - A, L.P."
        \(On-?shore\).*|\(Off-?shore\).*|
        \bFeeder\b.*|\bMaster\b.*|
        \bL\.?P\.?\b.*|\bLLC\b.*|\bLtd\.?\b.*|\bSCSp\b.*|
        \bSICAV.*|\bSLP\b.*|\bBusiness\ Trust\b.*
    )
    \s*$
    """,
    re.IGNORECASE | re.VERBOSE,
)


def derive_manager(issuer_name: str) -> str:
    if not issuer_name:
        return "Unknown"
    name = issuer_name.strip()
    prev = None
    while prev != name:
        prev = name
        name = FUND_DESIGNATOR_RE.sub("", name).strip().rstrip("-, ").strip()
    return name if len(name) >= 3 else issuer_name.strip()


def clean_committed_capital(offering_amt, sold_amt):
    sold = sold_amt or 0.0
    if offering_amt and 0 < offering_amt <= MAX_PLAUSIBLE_TARGET:
        if sold <= 0 or offering_amt / max(sold, 1) <= MAX_TARGET_TO_SOLD_RATIO:
            return offering_amt, "target"
    if sold and sold > 0:
        return sold, "raised_to_date"
    return None, None


def main() -> None:
    con = duckdb.connect(str(ADVISORAPP_DB), read_only=True)

    rows = con.execute(
        """
        select
            accession_number, filing_date, submission_type, is_amendment,
            previous_accession_number, investment_fund_type, is_pooled_fund,
            total_offering_amount, total_amount_sold, min_investment,
            has_non_accredited, issuer_name, issuer_state, entity_type
        from form_d_offerings
        where is_pooled_fund = true
          and issuer_name is not null
        """
    ).fetchdf()

    by_accession = {r.accession_number: r for r in rows.itertuples(index=False)}

    def find_root(acc: str, depth: int = 0) -> str:
        r = by_accession.get(acc)
        if r is None or not r.previous_accession_number or depth > 12:
            return acc
        if r.previous_accession_number not in by_accession:
            return acc
        return find_root(r.previous_accession_number, depth + 1)

    chains: dict[str, list] = {}
    for acc, r in by_accession.items():
        root = find_root(acc)
        chains.setdefault(root, []).append(r)

    funds = []
    for root, chain in chains.items():
        chain.sort(key=lambda r: r.filing_date)
        earliest = chain[0]
        latest = chain[-1]

        committed_capital, capital_basis = clean_committed_capital(
            _clean(latest.total_offering_amount), _clean(latest.total_amount_sold)
        )
        if committed_capital is None or committed_capital < 100_000:
            continue
        # A handful of long-running evergreen vehicles (money-market /
        # institutional cash trusts) report cumulative amount-sold across
        # decades of amendments that lands above any real single-fund
        # commitment size (largest known single PE/hedge vehicles top out
        # near $30-35B) -- treat those as unreliable and drop them rather
        # than let a handful of rows dominate the portfolio aggregate.
        if committed_capital > 50_000_000_000:
            continue

        fund_type = _clean(latest.investment_fund_type) or "Other Investment Fund"
        manager = derive_manager(latest.issuer_name)
        min_investment = _clean(latest.min_investment)
        has_non_accredited = _clean(latest.has_non_accredited)

        funds.append(
            {
                "id": root,
                "name": latest.issuer_name.strip(),
                "manager": manager,
                "fundType": fund_type,
                "vintageYear": earliest.filing_date.year,
                "committedCapital": round(committed_capital, 2),
                "capitalBasis": capital_basis,
                "minInvestment": round(min_investment, 2) if min_investment else None,
                "state": _clean(latest.issuer_state),
                "structure": _clean(latest.entity_type) or "Other",
                "hasNonAccredited": bool(has_non_accredited)
                if has_non_accredited is not None
                else None,
                "filingCount": len(chain),
                "lastFilingDate": latest.filing_date.isoformat(),
                "firstFilingDate": earliest.filing_date.isoformat(),
            }
        )

    funds.sort(key=lambda f: f["committedCapital"], reverse=True)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(funds, separators=(",", ":")))

    print(f"Wrote {len(funds)} funds to {OUT_PATH}")
    print(f"  by fundType: ", {})
    from collections import Counter

    print("  fundType counts:", Counter(f["fundType"] for f in funds))
    print("  vintageYear counts:", dict(sorted(Counter(f["vintageYear"] for f in funds).items())))
    print(
        "  committedCapital sum: $%.1fB"
        % (sum(f["committedCapital"] for f in funds) / 1e9)
    )
    print(f"  distinct managers: {len(set(f['manager'] for f in funds))}")


if __name__ == "__main__":
    main()
