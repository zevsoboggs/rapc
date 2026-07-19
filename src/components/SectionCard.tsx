import React from "react";
import { CARD_SHADOW, BRAND } from "../theme";

interface SectionCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  extra,
  children,
  bodyStyle,
  style,
  noPadding,
}) => (
  <div
    style={{
      background: "#fff",
      border: `1px solid ${BRAND.borderSubtle}`,
      boxShadow: CARD_SHADOW,
      borderRadius: 16,
      overflow: "hidden",
      ...style,
    }}
  >
    {(title || extra) && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "18px 24px",
          borderBottom: `1px solid ${BRAND.borderSubtle}`,
        }}
      >
        <div>
          {title && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: BRAND.textPrimary,
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ marginTop: 2, fontSize: 13, color: BRAND.textMuted }}>
              {subtitle}
            </div>
          )}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    )}
    <div style={{ padding: noPadding ? 0 : 24, ...bodyStyle }}>{children}</div>
  </div>
);
