export const formatMoney = (
  value: string | number | null | undefined,
  currency = "USD",
): string => {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  const safe = Number.isFinite(num as number) ? (num as number) : 0;
  const formatted = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === "USD" ? "$" : "";
  return `${symbol}${formatted}`;
};

export const formatSignedMoney = (
  value: string | number | null | undefined,
  currency = "USD",
): string => {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  const safe = Number.isFinite(num as number) ? (num as number) : 0;
  const sign = safe > 0 ? "+" : safe < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(safe), currency)}`;
};

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDay = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const isNegativeType = (type: string): boolean =>
  [
    "ISSUANCE_FEE",
    "CARD_LOAD",
    "TOPUP_FEE",
    "WITHDRAW_FEE",
    "MONTHLY_FEE",
  ].includes(type);
