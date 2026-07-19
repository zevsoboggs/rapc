import React from "react";

const FONT = "'Nunito', 'Varela Round', 'Montserrat', system-ui, sans-serif";
const RATIO = 550 / 140;

interface LogoProps {
  height?: number;
  onDark?: boolean;
  /** Hide the slogan line (compact lockup). */
  compact?: boolean;
  style?: React.CSSProperties;
}

/**
 * RapidCard wordmark — stylized "R"/card mark + "RapidCard" + slogan.
 * Renders dark by default (for light surfaces) and light on `onDark`.
 */
export const Logo: React.FC<LogoProps> = ({ height = 34, onDark, compact, style }) => {
  const main = onDark ? "#FFFFFF" : "#0B0B0B";
  const sub = onDark ? "#CBD5E1" : "#4B5563";
  return (
    <svg
      viewBox="0 0 550 140"
      height={height}
      width={height * RATIO}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", ...style }}
      role="img"
      aria-label="RapidCard"
    >
      <g fill="none" stroke={main} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 30,25 L 45,95" />
        <path d="M 60,25 L 82,25 A 16 16 0 0 1 98 41 L 98 43 A 16 16 0 0 1 82 59 L 65 59" />
        <path d="M 72,86 L 92,102" />
      </g>
      <text
        x="135"
        y={compact ? "95" : "82"}
        fontFamily={FONT}
        fontWeight={800}
        fontSize={66}
        fill={main}
        stroke={main}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        letterSpacing="-1"
      >
        RapidCard
      </text>
      {!compact && (
        <text x="140" y="112" fontFamily={FONT} fontWeight={700} fontSize={15} fill={sub} letterSpacing="2">
          PROGRAMMABLE CARD ISSUING
        </text>
      )}
    </svg>
  );
};

export default Logo;
