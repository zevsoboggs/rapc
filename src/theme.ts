import type { ThemeConfig } from "antd";

// Unified "Premium Fintech SaaS" blue design system.
// Shared identically between the admin panel and the billing portal.
export const BRAND = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryActive: "#1E40AF",
  primarySoft: "#EFF4FF",
  primarySoft2: "#DBE7FF",
  gradient: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #4F86F7 100%)",
  appBg: "#F4F7FC",
  surface: "#FFFFFF",
  borderSubtle: "#EDF1F7",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  error: "#DC2626",
  errorSoft: "#FEE2E2",
  info: "#2563EB",
  infoSoft: "#DBEAFE",
  positive: "#16A34A",
  negative: "#DC2626",
} as const;

export const CARD_SHADOW =
  "0 1px 2px rgba(16,24,40,.04), 0 4px 14px rgba(16,24,40,.05)";
export const CARD_SHADOW_HOVER = "0 10px 28px rgba(16,24,40,.10)";

export type Tint = "blue" | "green" | "violet" | "amber";

export const TINTS: Record<Tint, { bg: string; fg: string }> = {
  blue: { bg: "#EFF4FF", fg: "#2563EB" },
  green: { bg: "#DCFCE7", fg: "#16A34A" },
  violet: { bg: "#EDE9FE", fg: "#7C3AED" },
  amber: { bg: "#FEF3C7", fg: "#D97706" },
};

export const theme: ThemeConfig = {
  token: {
    colorPrimary: "#2563EB",
    colorInfo: "#2563EB",
    colorSuccess: "#16A34A",
    colorWarning: "#D97706",
    colorError: "#DC2626",
    colorTextBase: "#0F172A",
    colorBgLayout: "#F4F7FC",
    colorBgContainer: "#FFFFFF",
    colorBorderSecondary: "#EDF1F7",
    colorBorder: "#E2E8F0",
    borderRadius: 10,
    borderRadiusLG: 16,
    fontFamily: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    controlHeight: 40,
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: "#FFFFFF",
      headerBg: "#FFFFFF",
      bodyBg: "#F4F7FC",
      headerHeight: 64,
    },
    Menu: {
      itemBg: "transparent",
      subMenuItemBg: "transparent",
      itemSelectedBg: "#EFF4FF",
      itemSelectedColor: "#2563EB",
      itemColor: "#475569",
      itemHoverBg: "#F4F7FC",
      itemBorderRadius: 10,
      itemHeight: 44,
      itemMarginInline: 10,
      itemMarginBlock: 4,
      iconSize: 18,
    },
    Card: { borderRadiusLG: 16, paddingLG: 24, colorBorderSecondary: "#EDF1F7" },
    Table: {
      headerBg: "#FAFBFE",
      headerColor: "#64748B",
      headerSplitColor: "transparent",
      borderColor: "#EDF1F7",
      rowHoverBg: "#F7F9FD",
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Button: {
      controlHeight: 40,
      controlHeightLG: 46,
      borderRadius: 10,
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
    },
    Input: {
      controlHeight: 40,
      borderRadius: 10,
      activeShadow: "0 0 0 3px rgba(37,99,235,.12)",
    },
    Select: { controlHeight: 40, borderRadius: 10 },
    Tag: { borderRadiusSM: 6 },
    Statistic: { titleFontSize: 13, contentFontSize: 28 },
    Segmented: { borderRadius: 10, trackBg: "#EFF2F7" },
  },
};
