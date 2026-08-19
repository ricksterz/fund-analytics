"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFunds } from "@/lib/useFunds";
import { useFilterStore, filterFunds } from "@/store/useFilterStore";
import { buildProjection, computePME } from "@/lib/model";
import { filtersToSearchParams, searchParamsToFilters } from "@/lib/urlState";
import { MethodologySelector } from "@/components/MethodologySelector";
import { MetricsGrid } from "@/components/MetricsGrid";
import { FilterBar } from "@/components/FilterBar";
import { JCurveChart } from "@/components/JCurveChart";
import { CashFlowTable } from "@/components/CashFlowTable";
import { FundExplorer } from "@/components/FundExplorer";
import { ShareButton } from "@/components/ShareButton";
import { RelativePerformance } from "@/components/RelativePerformance";
import { Disclosure } from "@/components/Disclosure";
import { JCurveIcon } from "@/components/JCurveIcon";
import { METHODOLOGIES } from "@/lib/types";
import { formatCurrencyCompact } from "@/lib/format";

export default function Home() {
  const { funds, loading } = useFunds();
  const filters = useFilterStore();
  const initBounds = useFilterStore((s) => s.initBounds);
  const hydrate = useFilterStore((s) => s.hydrate);
  const hydratedFromUrl = useRef(false);

  useEffect(() => {
    if (funds.length > 0 && !filters.boundsInitialized) initBounds(funds);
  }, [funds, filters.boundsInitialized, initBounds]);

  // Apply any shared-link params once, right after bounds (and thus default
  // ranges) are established, so a narrower shared range isn't clobbered.
  useEffect(() => {
    if (filters.boundsInitialized && !hydratedFromUrl.current) {
      hydratedFromUrl.current = true;
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length > 0) {
        hydrate(searchParamsToFilters(params));
      }
    }
  }, [filters.boundsInitialized, hydrate]);

  // Keep the URL in sync with the current view so the address bar is always
  // a valid share link, without polluting browser history.
  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = filtersToSearchParams(filters);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
  }, [filters]);

  const filtered = useMemo(() => filterFunds(funds, filters), [funds, filters]);
  const projection = useMemo(
    () => buildProjection(filtered, filters.methodology),
    [filtered, filters.methodology]
  );
  const selectedFunds = useMemo(
    () => (filters.fundIds.length ? funds.filter((f) => filters.fundIds.includes(f.id)) : []),
    [funds, filters.fundIds]
  );
  const pme = useMemo(
    () => computePME(filtered, filters.methodology, filters.benchmarkReturn),
    [filtered, filters.methodology, filters.benchmarkReturn]
  );

  const methodologyLabel = METHODOLOGIES.find((m) => m.id === filters.methodology)?.label;

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-30">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <JCurveIcon className="h-7 w-7 sm:h-8 sm:w-8 text-teal-400 shrink-0" />
              <h1 className="font-display italic font-medium text-2xl sm:text-3xl tracking-tight text-neutral-50">
                Vantage Curve
              </h1>
            </div>
            <p className="font-display italic text-sm sm:text-base text-teal-300/80 mt-0.5">
              Every vintage. Every curve. One vantage point.
            </p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Real fund identity from the SEC Form D pipeline, modeled capital-call &amp; NAV projections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-neutral-500 hidden sm:block">
              {loading ? (
                "Loading fund data..."
              ) : (
                <>
                  {funds.length.toLocaleString()} Form D filings loaded
                  <br />
                  Vintages {filters.bounds.vintageMin}–{filters.bounds.vintageMax}
                </>
              )}
            </div>
            {!loading && <ShareButton selectedFunds={selectedFunds} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-5 flex flex-col gap-5">
        {loading ? (
          <div className="flex items-center justify-center py-32 text-neutral-500 text-sm">
            Loading fund dataset (~37K funds)...
          </div>
        ) : (
          <>
            {selectedFunds.length > 0 && (
              <div className="rounded-lg border border-teal-400/40 bg-teal-400/5 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-teal-200">
                  Now analyzing{" "}
                  <strong>
                    {selectedFunds.length === 1
                      ? selectedFunds[0].name
                      : `${selectedFunds.length} selected funds`}
                  </strong>
                  {selectedFunds.length === 1 && (
                    <span className="text-teal-400/70">
                      {" "}
                      · {selectedFunds[0].manager} · {formatCurrencyCompact(selectedFunds[0].committedCapital)}{" "}
                      committed
                    </span>
                  )}
                </div>
                <ShareButton selectedFunds={selectedFunds} />
              </div>
            )}

            <MethodologySelector />

            {filters.showPME && <RelativePerformance pme={pme} />}

            <div>
              <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-2">
                Portfolio Summary — {methodologyLabel}
              </h2>
              <MetricsGrid metrics={projection.metrics} />
            </div>

            <FilterBar />

            <div>
              <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-2">
                Interactive J-Curve
              </h2>
              <JCurveChart points={projection.points} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-2">
                Annual Cash Flow Projection
              </h2>
              <CashFlowTable points={projection.points} committedCapital={projection.metrics.committedCapital} />
            </div>

            <FundExplorer funds={filtered} />

            <Disclosure />
          </>
        )}
      </main>
    </div>
  );
}
