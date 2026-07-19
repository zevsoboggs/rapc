import React from "react";
import { CARD_SHADOW, TINTS, type Tint, BRAND } from "../theme";

interface StatCardProps {
  icon: React.ReactNode;
  tint?: Tint;
  label: string;
  value: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
  footer?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  tint = "blue",
  label,
  value,
  trend,
  trendPositive = true,
  highlight,
  footer,
}) => {
  const t = TINTS[tint];
  return (
    <div
      className="rc-elevate"
      style={{
        background: highlight ? BRAND.gradient : "#fff",
        border: `1px solid ${highlight ? "transparent" : BRAND.borderSubtle}`,
        boxShadow: CARD_SHADOW,
        borderRadius: 16,
        padding: 20,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: highlight ? "rgba(255,255,255,.18)" : t.bg,
            color: highlight ? "#fff" : t.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
              background: highlight
                ? "rgba(255,255,255,.18)"
                : trendPositive
                  ? BRAND.successSoft
                  : BRAND.errorSoft,
              color: highlight
                ? "#fff"
                : trendPositive
                  ? BRAND.success
                  : BRAND.error,
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div
        className="tabular"
        style={{
          fontSize: 29,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          color: highlight ? "#fff" : BRAND.textPrimary,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          fontWeight: 500,
          color: highlight ? "rgba(255,255,255,.85)" : BRAND.textMuted,
        }}
      >
        {label}
      </div>
      {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
    </div>
  );
};
