import logoUrl from "../assets/logo.png";
import { BRAND } from "../theme";

// Kept for backwards-compat with older imports.
export const BRAND_COLOR = BRAND.primary;

interface BrandProps {
  collapsed?: boolean;
  size?: number;
  onDark?: boolean;
}

// Compact mark for the collapsed sidebar (card + arrow, from the logo motif).
const Emblem = () => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: 12,
      background: "#0B1220",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
    aria-label="RapidCard"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="3" fill="#fff" />
      <rect x="2.5" y="8.3" width="19" height="2.6" fill="#1E3A8A" />
      <path d="M6 15.5h5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M14.5 15.5h3.5m0 0-1.4-1.4m1.4 1.4-1.4 1.4"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/**
 * RapidCard logo. The artwork is light, so on light surfaces it sits on a clean
 * dark badge to stay legible; on dark surfaces it renders directly.
 */
export const Brand: React.FC<BrandProps> = ({ collapsed, size = 34, onDark }) => {
  if (collapsed) return <Emblem />;

  if (onDark) {
    return (
      <img src={logoUrl} alt="RapidCard" style={{ height: size, width: "auto", display: "block" }} />
    );
  }

  // Light surface (sidebar) — real logo on a clean dark badge.
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#0B1220",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 4px 14px rgba(11,18,32,.18)",
      }}
    >
      <img src={logoUrl} alt="RapidCard" style={{ height: 22, width: "auto", display: "block" }} />
    </div>
  );
};

// Legacy alias used by the Refine layout title slot.
export const TitleBrand: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => (
  <Brand collapsed={collapsed} />
);
