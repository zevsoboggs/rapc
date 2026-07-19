import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRAND } from "../theme";
import { formatMoney } from "../utils/format";

const axisStyle = { fontSize: 11, fill: BRAND.textMuted } as const;

const TooltipBox: React.FC<{ label?: React.ReactNode; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div
    style={{
      background: "#0F172A",
      color: "#fff",
      borderRadius: 10,
      padding: "8px 12px",
      fontSize: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    }}
  >
    {label && <div style={{ opacity: 0.7, marginBottom: 2 }}>{label}</div>}
    <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
  </div>
);

/** Balance / spend trend area chart. data: { label, value }[] */
export const TrendAreaChart: React.FC<{
  data: { label: string; value: number }[];
  height?: number;
  money?: boolean;
}> = ({ data, height = 260, money = true }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id="rcArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.28} />
          <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={24} />
      <YAxis
        tick={axisStyle}
        axisLine={false}
        tickLine={false}
        width={48}
        tickFormatter={(v) => (money ? `$${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : v}` : `${v}`)}
      />
      <Tooltip
        cursor={{ stroke: BRAND.border, strokeWidth: 1 }}
        content={({ active, payload, label }) =>
          active && payload && payload.length ? (
            <TooltipBox
              label={label}
              value={money ? formatMoney(payload[0].value as number) : payload[0].value}
            />
          ) : null
        }
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke={BRAND.primary}
        strokeWidth={2.5}
        fill="url(#rcArea)"
        dot={false}
        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

/** Small bar chart, e.g. spend by category. */
export const MiniBarChart: React.FC<{
  data: { label: string; value: number }[];
  height?: number;
}> = ({ data, height = 200 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
      <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
      <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
      <Tooltip
        cursor={{ fill: "rgba(37,99,235,.06)" }}
        content={({ active, payload, label }) =>
          active && payload && payload.length ? (
            <TooltipBox label={label} value={formatMoney(payload[0].value as number)} />
          ) : null
        }
      />
      <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={BRAND.primary} maxBarSize={34} />
    </BarChart>
  </ResponsiveContainer>
);

const DONUT_COLORS = [BRAND.primary, "#16A34A", "#7C3AED", "#D97706", "#94A3B8"];

/** Donut, e.g. cards by status. data: { label, value }[] */
export const DonutChart: React.FC<{
  data: { label: string; value: number }[];
  height?: number;
  centerLabel?: React.ReactNode;
  centerValue?: React.ReactNode;
}> = ({ data, height = 220, centerLabel, centerValue }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={total ? data : [{ label: "No data", value: 1 }]}
            dataKey="value"
            nameKey="label"
            innerRadius="66%"
            outerRadius="92%"
            paddingAngle={total ? 2 : 0}
            stroke="none"
          >
            {(total ? data : [{ label: "x", value: 1 }]).map((_, i) => (
              <Cell key={i} fill={total ? DONUT_COLORS[i % DONUT_COLORS.length] : "#E2E8F0"} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <TooltipBox label={payload[0].name} value={payload[0].value} />
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div className="tabular" style={{ fontSize: 26, fontWeight: 700, color: BRAND.textPrimary }}>
          {centerValue ?? total}
        </div>
        <div style={{ fontSize: 12, color: BRAND.textMuted }}>{centerLabel ?? "Total"}</div>
      </div>
    </div>
  );
};

export const ChartLegend: React.FC<{ data: { label: string; value: number }[] }> = ({
  data,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {data.map((d, i) => (
      <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: BRAND.textSecondary }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
          {d.label}
        </span>
        <span className="tabular" style={{ fontWeight: 600, color: BRAND.textPrimary }}>{d.value}</span>
      </div>
    ))}
  </div>
);
