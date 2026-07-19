import React from "react";

// Soft pastel gradients used for the card "art" tiles across the portal.
const PASTELS = [
  "linear-gradient(135deg, #c6d2fb 0%, #e7d2f6 100%)",
  "linear-gradient(135deg, #d2ddfb 0%, #f3d0e5 100%)",
  "linear-gradient(135deg, #cfe0fb 0%, #d6efe9 100%)",
  "linear-gradient(135deg, #dbd5fb 0%, #f5d6d6 100%)",
  "linear-gradient(135deg, #c8e1fb 0%, #e5d5fb 100%)",
  "linear-gradient(135deg, #d7d1fb 0%, #cfe6fb 100%)",
];

function pickGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PASTELS[h % PASTELS.length];
}

/** Encode an SVG string into a CSS-safe data URL for use as a background image. */
export function svgUrl(svg?: string | null): string | undefined {
  if (!svg) return undefined;
  if (svg.startsWith("data:") || svg.startsWith("http")) return `url("${svg}")`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// Compact dark "rapid" double-chevron brand mark that reads on pastel surfaces.
export const RapidMark: React.FC<{ size?: number; color?: string }> = ({ size = 30, color = "#1e293b" }) => (
  <svg width={size} height={size * 0.74} viewBox="0 0 34 25" fill="none" aria-hidden>
    <path d="M2 23 L11 2 L15.5 2 L6.5 23 Z" fill={color} />
    <path d="M14 23 L23 2 L27.5 2 L18.5 23 Z" fill={color} />
  </svg>
);

interface ProgramTileProps {
  name: string;
  seed?: string;
  color?: string | null;
  /** Real card artwork (SVG string / data URL). When set, it becomes the full card face. */
  artworkSvg?: string | null;
  height?: number;
  radius?: number;
  fontSize?: number;
  style?: React.CSSProperties;
  // Optional overlays for an issued-card face
  footer?: React.ReactNode;
}

/**
 * Card art. When the program has real SVG artwork it is rendered full-bleed;
 * otherwise a soft pastel gradient tile with the category name + brand mark
 * (matching the approved mockup).
 */
export const ProgramTile: React.FC<ProgramTileProps> = ({
  name,
  seed,
  color,
  artworkSvg,
  height = 150,
  radius = 18,
  fontSize = 26,
  style,
  footer,
}) => {
  const art = svgUrl(artworkSvg);

  // Real artwork → render it as the entire card face, no drawn overlays.
  // Width fills the parent; height follows the card aspect ratio so it can
  // never overflow its column.
  if (art) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1.586 / 1",
          borderRadius: radius,
          overflow: "hidden",
          backgroundImage: art,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 14px 34px -14px rgba(15,23,42,.5)",
          ...style,
        }}
      >
        {footer}
      </div>
    );
  }

  const bg = color && color.includes("gradient") ? color : pickGradient(seed || name);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: radius,
        background: bg,
        height,
        padding: "20px 22px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...style,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 800,
          color: "#1e293b",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          maxWidth: "80%",
        }}
      >
        {name}
      </div>
      {footer}
      <div style={{ position: "absolute", right: 20, bottom: 16 }}>
        <RapidMark />
      </div>
    </div>
  );
};

export default ProgramTile;
