export function Disclosure() {
  return (
    <footer className="border-t border-neutral-800 pt-4 pb-8 text-[11px] leading-relaxed text-neutral-600">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Disclosure</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3 max-w-5xl">
        <p>
          <strong className="text-neutral-500">Not investment advice.</strong> This tool is provided for
          informational and illustrative purposes only. Nothing on this page is an offer to sell, or a solicitation
          of an offer to buy, any security or fund interest, and none of it constitutes investment, legal, tax, or
          accounting advice. Consult a licensed financial, tax, or legal advisor before making any investment
          decision.
        </p>
        <p>
          <strong className="text-neutral-500">What&apos;s real vs. modeled.</strong> Fund name, manager, fund type,
          vintage year, committed capital, entity structure, and domicile are sourced from SEC Form D — the public
          filing companies submit when raising capital through a private (exempt) offering — covering 2020–2026.
          Form D discloses the offering itself, not what happens afterward: it contains no capital-call,
          distribution, or NAV history for any fund. Every capital-call, distribution, NAV, and return figure shown
          on this page is <em>modeled</em> by the selected methodology from industry-standard assumptions (rate of
          capital deployment, growth, distribution yield, etc.), not sourced from actual fund performance records.
        </p>
        <p>
          <strong className="text-neutral-500">Vintage years follow two conventions.</strong> For 2025–2026 funds,
          committed capital reflects each fund&apos;s most recently amended filing. For 2020–2024 funds, it reflects
          only the fund&apos;s original filing, since tracking every amendment that far back wasn&apos;t practical —
          so committed capital for older vintages can understate a fund&apos;s eventual full raise.
        </p>
        <p>
          <strong className="text-neutral-500">Duplicate filings removed.</strong> The same fund is often
          represented by more than one SEC filing — a feeder vehicle alongside its master fund, parallel share
          classes (&quot;Fund VI&quot;, &quot;Fund VI-A&quot;, &quot;Fund VI-B&quot;), onshore/offshore twins, or
          simply the same offering refiled from scratch rather than amended — each reporting the same committed
          capital under a matching or near-matching name. Counting every one of those separately would overstate
          total capital and fund count. Where that pattern is unambiguous (the same dollar figure repeated across
          clearly related filings), only one representative filing is counted. Cases with genuinely different
          amounts across related filings are left as separate entries, since those plausibly represent real,
          distinct pools of capital rather than one total counted twice.
        </p>
        <p>
          <strong className="text-neutral-500">&quot;Filings,&quot; not a deduplicated fund count.</strong> The
          fund count shown reflects Form D <em>offerings</em> from 2020–2026, not a registry of distinct private
          funds, so it isn&apos;t directly comparable to SEC&apos;s own published{" "}
          <a
            href="https://www.sec.gov/data-research/statistics-data-visualizations/private-fund-statistics"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-400"
          >
            Private Fund Statistics
          </a>{" "}
          (54,392 funds at large advisers, Form PF, 2025Q3; ~108,752 funds across all SEC-registered advisers, most
          recent snapshot). Those are point-in-time counts of currently active funds; this is a count of offering
          filings over a fixed window — a fund can still file more than one Form D for a real, separate vehicle, and
          Form D itself doesn&apos;t require the issuer to have a registered investment adviser at all, so this
          number and SEC&apos;s will never match exactly.
        </p>
        <p>
          <strong className="text-neutral-500">Some vintages skew large from long-running funds.</strong> When a
          fund&apos;s exact target size isn&apos;t stated, this dataset falls back to the cumulative amount a fund
          has ever raised, as reported on its most recent SEC filing. For a fund that opened and closed within the
          window this covers, that&apos;s a reasonable stand-in for committed capital. For an open-ended fund
          that&apos;s been continuously raising capital for years or decades — a well-known hedge fund, for
          instance — that same field reflects its <em>entire operating history</em>, not new capital formed in the
          year it happens to be grouped under here. That&apos;s why vintage 2025 shows a disproportionately large
          total: it&apos;s where several decades-old, very large funds&apos; most recent filings happened to land.
          There&apos;s no reliable way to tell &quot;genuinely new large fund&quot; apart from &quot;long-running
          fund&apos;s lifetime total&quot; from this data alone, so figures are shown as reported rather than
          adjusted by guesswork.
        </p>
        <p>
          <strong className="text-neutral-500">No guarantee of accuracy.</strong> Data is provided &quot;as is&quot;
          from public SEC filings and may contain filer errors, omissions, or reporting anomalies — a small number
          of implausible outlier values were excluded. Modeled projections rely on simplified assumptions and
          simulated randomness; actual fund cash flows, NAV, and returns will differ, often materially, from any
          figure shown here. Past or projected performance is not indicative of future results.
        </p>
        <p>
          <strong className="text-neutral-500">PME / Direct Alpha.</strong> The Public Market Equivalent and Direct
          Alpha figures benchmark modeled cash flows against a hypothetical index compounding at a constant,
          user-set annual rate — not a real historical index feed (e.g. actual S&amp;P 500 daily returns). Treat
          them as an illustration of the comparison method, not a live benchmark.
        </p>
        <p className="lg:col-span-2 text-neutral-700">
          Not affiliated with, endorsed by, or a service of the U.S. Securities and Exchange Commission. Fund names
          and manager names are drawn from public regulatory filings and are shown for identification purposes only.
        </p>
      </div>
    </footer>
  );
}
