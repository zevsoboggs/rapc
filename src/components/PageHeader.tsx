import React from "react";
import { BRAND } from "../theme";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  extra,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 24,
    }}
  >
    <div>
      <h1
        style={{
          margin: 0,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: BRAND.textPrimary,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <div style={{ marginTop: 4, fontSize: 14, color: BRAND.textSecondary }}>
          {subtitle}
        </div>
      )}
    </div>
    {extra && (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{extra}</div>
    )}
  </div>
);
