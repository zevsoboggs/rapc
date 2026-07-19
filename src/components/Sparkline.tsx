import React from "react";
import { BRAND } from "../theme";

interface SparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

// Deterministic demo series (no series endpoint exists in the portal API).
const DEFAULT_DATA = [
  12, 18, 14, 22, 19, 28, 24, 33, 30, 38, 34, 44, 40, 52, 48,
];

export const Sparkline: React.FC<SparklineProps> = ({
  data = DEFAULT_DATA,
  width = 120,
  height = 36,
  stroke = BRAND.primary,
}) => {
  const id = React.useId().replace(/[:]/g, "");
  const pad = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    `${linePath} L${points[points.length - 1][0].toFixed(2)},${height - pad} ` +
    `L${points[0][0].toFixed(2)},${height - pad} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${id})`} />
      <path
        d={linePath}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.6}
        fill={stroke}
      />
    </svg>
  );
};
