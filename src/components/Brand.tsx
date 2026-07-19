import { Logo } from "./Logo";
import { BRAND } from "../theme";

// Kept for backwards-compat with older imports.
export const BRAND_COLOR = BRAND.primary;

interface BrandProps {
  collapsed?: boolean;
  size?: number;
  onDark?: boolean;
}

// Compact mark only (collapsed rails / tight spaces).
const Emblem: React.FC<{ onDark?: boolean }> = ({ onDark }) => (
  <svg width="40" height="40" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-label="RapidCard">
    <g fill="none" stroke={onDark ? "#fff" : "#0B0B0B"} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" transform="translate(8,6)">
      <path d="M 30,25 L 45,95" />
      <path d="M 60,25 L 82,25 A 16 16 0 0 1 98 41 L 98 43 A 16 16 0 0 1 82 59 L 65 59" />
      <path d="M 72,86 L 92,102" />
    </g>
  </svg>
);

/** RapidCard logo. Renders the vector wordmark directly — dark on light, light on dark. */
export const Brand: React.FC<BrandProps> = ({ collapsed, size = 40, onDark }) => {
  if (collapsed) return <Emblem onDark={onDark} />;
  return <Logo height={size} onDark={onDark} />;
};

// Legacy alias used by the Refine layout title slot.
export const TitleBrand: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => (
  <Brand collapsed={collapsed} />
);
