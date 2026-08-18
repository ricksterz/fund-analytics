"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { YearPoint } from "@/lib/types";
import { formatCurrencyCompact, formatCurrencyFull } from "@/lib/format";

interface SeriesToggle {
  key: string;
  label: string;
  color: string;
  default: boolean;
}

const SERIES: SeriesToggle[] = [
  { key: "calls", label: "Capital Calls", color: "#f87171", default: true },
  { key: "distributions", label: "Distributions", color: "#34d399", default: true },
  { key: "cumulative", label: "Cumulative Net Cash Flow", color: "#38bdf8", default: true },
  { key: "nav", label: "Projected NAV", color: "#c084fc", default: true },
  { key: "band", label: "Distribution Range (P10-P90)", color: "#38bdf8", default: true },
];

export function JCurveChart({ points }: { points: YearPoint[] }) {
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(SERIES.map((s) => [s.key, s.default]))
  );

  const data = useMemo(
    () =>
      points.map((p) => ({
        year: `Yr ${p.year}`,
        calls: -p.capitalCalled,
        distributions: p.distributions,
        cumulative: p.cumulativeNetCashFlow,
        nav: p.nav,
        cnwBand: [p.cumulativeNetCashFlowP10, p.cumulativeNetCashFlowP90] as [number, number],
      })),
    [points]
  );

  const toggle = (key: string) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
        {SERIES.map((s) => (
          <label key={s.key} className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visible[s.key]}
              onChange={() => toggle(s.key)}
              className="accent-teal-400 h-3.5 w-3.5"
            />
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </label>
        ))}
      </div>
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="year" tick={{ fill: "#a3a3a3", fontSize: 12 }} axisLine={{ stroke: "#404040" }} />
            <YAxis
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              axisLine={{ stroke: "#404040" }}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
            />
            <Tooltip
              contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#e5e5e5" }}
              formatter={(value: unknown, name: unknown) => {
                const label = String(name ?? "");
                if (Array.isArray(value)) {
                  return [`${formatCurrencyFull(value[0])} - ${formatCurrencyFull(value[1])}`, label];
                }
                return [formatCurrencyFull(value as number), label];
              }}
            />
            <Legend wrapperStyle={{ display: "none" }} />
            <ReferenceLine y={0} stroke="#525252" />
            {visible.band && (
              <Area
                dataKey="cnwBand"
                name="Net Cash Flow Range (P10-P90)"
                stroke="none"
                fill="#38bdf8"
                fillOpacity={0.15}
                isAnimationActive={false}
              />
            )}
            {visible.calls && <Bar dataKey="calls" name="Capital Calls" fill="#f87171" radius={[0, 0, 2, 2]} />}
            {visible.distributions && (
              <Bar dataKey="distributions" name="Distributions" fill="#34d399" radius={[2, 2, 0, 0]} />
            )}
            {visible.nav && (
              <Line
                type="monotone"
                dataKey="nav"
                name="Projected NAV"
                stroke="#c084fc"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {visible.cumulative && (
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Net Cash Flow"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">
        X-axis is fund age (years since vintage), aggregated across the filtered portfolio&apos;s vintages. The
        blue line is the J-curve: cumulative net cash flow (distributions minus calls) since inception.
      </p>
    </div>
  );
}
