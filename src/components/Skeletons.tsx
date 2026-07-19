import React from "react";
import { SectionCard } from "./SectionCard";

/** Primitive shimmer block. */
export const Skel: React.FC<{
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}> = ({ w = "100%", h = 14, r = 8, style }) => (
  <div className="rc-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

export const StatCardSkeleton: React.FC = () => (
  <div className="rc-card" style={{ padding: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <Skel w={44} h={44} r={12} />
      <Skel w={52} h={22} r={999} />
    </div>
    <Skel w={120} h={30} style={{ marginTop: 18 }} />
    <Skel w={80} h={12} style={{ marginTop: 10 }} />
  </div>
);

export const CardVisualSkeleton: React.FC<{ width?: number | string }> = ({ width = 380 }) => (
  <div
    className="rc-skel"
    style={{ width, maxWidth: "100%", aspectRatio: "1.586 / 1", borderRadius: 18 }}
  />
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 240 }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height, padding: "8px 4px" }}>
    {[40, 65, 50, 80, 60, 90, 72, 100, 68, 84, 55, 78].map((h, i) => (
      <Skel key={i} w="100%" h={`${h}%`} r={6} />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div>
    <div style={{ display: "flex", gap: 16, padding: "0 4px 14px" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skel key={i} h={12} w={`${100 / cols}%`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ display: "flex", gap: 16, padding: "14px 4px", borderTop: "1px solid #f1f5f9" }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skel key={c} h={14} w={`${100 / cols}%`} />
        ))}
      </div>
    ))}
  </div>
);

export const ProgramCardSkeleton: React.FC = () => (
  <div className="rc-card" style={{ padding: 18 }}>
    <CardVisualSkeleton width="100%" />
    <Skel w="60%" h={16} style={{ marginTop: 16 }} />
    <Skel w="40%" h={12} style={{ marginTop: 10 }} />
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <Skel h={40} r={10} />
      <Skel h={40} r={10} />
    </div>
  </div>
);

/** Wrap a titled section whose body is loading. */
export const SectionCardSkeleton: React.FC<{ title?: string; height?: number }> = ({
  title,
  height = 240,
}) => (
  <SectionCard title={title ?? <Skel w={140} h={16} />}>
    <TableSkeleton rows={Math.max(3, Math.round(height / 48))} />
  </SectionCard>
);
