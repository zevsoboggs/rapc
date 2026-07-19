import React, { useState } from "react";
import type { Service } from "../data/compliance";
import { BRAND } from "../theme";

const PALETTE = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#0891B2", "#16A34A", "#CA8A04", "#DC2626", "#0D9488", "#4F46E5"];
function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Circular brand icon — real logo when available, deterministic letter avatar otherwise. */
export const ServiceIcon: React.FC<{ service: Service; size?: number }> = ({ service, size = 40 }) => {
  const [failed, setFailed] = useState(false);
  const letter = (service.name.replace(/[^A-Za-z0-9]/g, "")[0] || "?").toUpperCase();

  if (service.icon && !failed) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#fff",
          border: `1px solid ${BRAND.borderSubtle}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img src={service.icon} width={size} height={size} alt="" loading="lazy" style={{ objectFit: "cover" }} onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: hashColor(service.name),
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  );
};
