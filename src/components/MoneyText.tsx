import React from "react";
import { BRAND } from "../theme";
import { formatMoney, formatSignedMoney } from "../utils/format";

interface MoneyTextProps {
  value: string | number | null | undefined;
  currency?: string;
  signed?: boolean;
  colored?: boolean;
  strong?: boolean;
  size?: number;
  style?: React.CSSProperties;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  value,
  currency = "USD",
  signed = false,
  colored = false,
  strong = false,
  size,
  style,
}) => {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  const text = signed
    ? formatSignedMoney(value, currency)
    : formatMoney(value, currency);

  let color: string | undefined;
  if (colored) {
    color =
      num > 0 ? BRAND.positive : num < 0 ? BRAND.negative : BRAND.textSecondary;
  }

  return (
    <span
      className="tabular"
      style={{
        color,
        fontWeight: strong ? 700 : 500,
        fontSize: size,
        ...style,
      }}
    >
      {text}
    </span>
  );
};
