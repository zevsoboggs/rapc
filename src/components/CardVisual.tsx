import React from "react";
import logoUrl from "../assets/logo.png";
import type { Card, Program } from "../types";

interface CardFace {
  artworkSvg?: string | null;
  cardColor?: string | null;
  maskedPan?: string | null;
  last4?: string | null;
  holder?: string | null;
  expDate?: string | null;
  network?: string | null;
  cardType?: string | null;
  status?: string | null;
}

interface CardVisualProps {
  card?: Card;
  program?: Program;
  face?: CardFace;
  width?: number | string;
  interactive?: boolean;
  style?: React.CSSProperties;
}

/** Encode an SVG string into a CSS-safe data URL for use as a background image. */
function svgUrl(svg?: string | null): string | undefined {
  if (!svg) return undefined;
  if (svg.startsWith("data:") || svg.startsWith("http")) return svg;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function groupPan(masked?: string | null, last4?: string | null): string {
  if (masked) {
    const digits = masked.replace(/[^0-9*•]/g, "");
    return digits.replace(/(.{4})/g, "$1 ").trim() || masked;
  }
  return `•••• •••• •••• ${last4 ?? "••••"}`;
}

const NetworkMark: React.FC<{ network?: string | null }> = ({ network }) => {
  if ((network || "").toUpperCase() === "MASTERCARD") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#EB001B", display: "inline-block" }} />
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#F79E1B", marginLeft: -12, mixBlendMode: "screen", display: "inline-block" }} />
      </div>
    );
  }
  return (
    <span style={{ fontStyle: "italic", fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: "-0.5px", textShadow: "0 1px 2px rgba(0,0,0,.25)" }}>
      VISA
    </span>
  );
};

const EmvChip: React.FC = () => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
    <rect x="0.5" y="0.5" width="39" height="29" rx="5" fill="#F2C94C" fillOpacity="0.95" />
    <rect x="0.5" y="0.5" width="39" height="29" rx="5" stroke="#B78A2A" strokeOpacity="0.5" />
    <path d="M0 15h13M40 15H27M20 0v6M20 30v-6M13 8v14a3 3 0 003 3h8a3 3 0 003-3V8" stroke="#B78A2A" strokeOpacity="0.7" strokeWidth="1.2" fill="none" />
  </svg>
);

/**
 * Realistic virtual/physical card mockup. Uses the program's SVG artwork as the
 * full-bleed face, falling back to a gradient built from `cardColor`.
 */
export const CardVisual: React.FC<CardVisualProps> = ({
  card,
  program,
  face,
  width = 380,
  interactive,
  style,
}) => {
  const f: CardFace = face ?? {
    artworkSvg: card?.program?.artworkSvg ?? program?.artworkSvg,
    cardColor: card?.program?.cardColor ?? program?.cardColor,
    maskedPan: card?.maskedPan,
    last4: card?.last4,
    holder: card?.holderEmail ?? undefined,
    expDate: card?.expDate ?? undefined,
    network: card?.network ?? program?.network,
    cardType: card?.cardType ?? program?.cardType,
    status: card?.status,
  };

  const base = f.cardColor || "#1E3A8A";
  const hasArt = !!f.artworkSvg;
  const bg = hasArt
    ? svgUrl(f.artworkSvg)
    : `linear-gradient(135deg, ${base} 0%, #1E40AF 60%, #172554 100%)`;
  const released = f.status === "RELEASED";

  return (
    <div
      className={interactive ? "rc-card-visual rc-elevate" : "rc-card-visual"}
      style={{
        position: "relative",
        width,
        maxWidth: "100%",
        aspectRatio: "1.586 / 1",
        borderRadius: 18,
        overflow: "hidden",
        color: "#fff",
        background: bg,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 18px 40px -12px rgba(15,23,42,.55), inset 0 1px 0 rgba(255,255,255,.15)",
        filter: released ? "grayscale(0.85) opacity(0.75)" : undefined,
        transition: "transform .18s ease, box-shadow .18s ease",
        ...style,
      }}
    >
      {/* When a custom SVG artwork is set, it IS the full card face — render it
          as-is with no drawn overlays (avoids doubling the chip/number/logo). */}
      {!hasArt && (
        <>
          {/* subtle sheen */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.12), rgba(255,255,255,0) 42%)", pointerEvents: "none" }} />

          {/* top row: brand + type chip */}
          <div style={{ position: "absolute", top: "7%", left: "6.5%", right: "6.5%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <img src={logoUrl} alt="RapidCard" style={{ height: 18, width: "auto", opacity: 0.96 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,.16)", backdropFilter: "blur(2px)", border: "1px solid rgba(255,255,255,.22)" }}>
              {(f.cardType || "VIRTUAL") === "PHYSICAL" ? "Physical" : "Virtual"}
            </span>
          </div>

          {/* chip */}
          <div style={{ position: "absolute", top: "34%", left: "6.5%" }}>
            <EmvChip />
          </div>

          {/* PAN */}
          <div style={{ position: "absolute", top: "55%", left: "6.5%", right: "6.5%", fontSize: "clamp(14px, 4.6cqw, 21px)", fontWeight: 600, letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums", textShadow: "0 1px 3px rgba(0,0,0,.35)", fontFamily: "'Inter', monospace" }}>
            {groupPan(f.maskedPan, f.last4)}
          </div>

          {/* bottom row: holder/expiry + network */}
          <div style={{ position: "absolute", bottom: "7%", left: "6.5%", right: "6.5%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8.5, letterSpacing: ".12em", opacity: 0.7, textTransform: "uppercase" }}>Cardholder</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190, textShadow: "0 1px 2px rgba(0,0,0,.3)" }}>
                {f.holder || "RAPIDCARD USER"}
              </div>
              <div style={{ fontSize: 8.5, letterSpacing: ".12em", opacity: 0.7, textTransform: "uppercase", marginTop: 4 }}>
                Exp {f.expDate ? String(f.expDate).slice(0, 7) : "••/••"}
              </div>
            </div>
            <NetworkMark network={f.network} />
          </div>
        </>
      )}

      {released && (
        <div style={{ position: "absolute", top: "44%", left: 0, right: 0, textAlign: "center", fontSize: 13, fontWeight: 800, letterSpacing: ".2em", color: "rgba(255,255,255,.9)" }}>
          CLOSED
        </div>
      )}
    </div>
  );
};

export default CardVisual;
