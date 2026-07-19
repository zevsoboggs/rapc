import React from "react";
import { BRAND } from "../theme";

type PillColor = "success" | "warning" | "error" | "info" | "neutral" | "violet";

const PALETTE: Record<PillColor, { bg: string; fg: string; dot: string }> = {
  success: { bg: BRAND.successSoft, fg: "#15803D", dot: BRAND.success },
  warning: { bg: BRAND.warningSoft, fg: "#B45309", dot: BRAND.warning },
  error: { bg: BRAND.errorSoft, fg: "#B91C1C", dot: BRAND.error },
  info: { bg: BRAND.infoSoft, fg: "#1D4ED8", dot: BRAND.info },
  violet: { bg: "#EDE9FE", fg: "#6D28D9", dot: "#7C3AED" },
  neutral: { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
};

interface Mapping {
  color: PillColor;
  label: string;
}

const CARD_STATUS: Record<string, Mapping> = {
  ACTIVE: { color: "success", label: "Active" },
  FROZEN: { color: "info", label: "Frozen" },
  RELEASED: { color: "neutral", label: "Released" },
  FAILED: { color: "error", label: "Failed" },
};

const CARD_TYPE: Record<string, Mapping> = {
  VIRTUAL: { color: "info", label: "Virtual" },
  PHYSICAL: { color: "violet", label: "Physical" },
};

const DEPOSIT_STATUS: Record<string, Mapping> = {
  pending: { color: "warning", label: "Pending" },
  processing: { color: "info", label: "Processing" },
  completed: { color: "success", label: "Completed" },
  cancelled: { color: "neutral", label: "Cancelled" },
  expired: { color: "error", label: "Expired" },
};

const LEDGER_TYPE: Record<string, Mapping> = {
  DEPOSIT: { color: "success", label: "Deposit" },
  ADJUSTMENT: { color: "info", label: "Adjustment" },
  ISSUANCE_FEE: { color: "warning", label: "Issuance fee" },
  CARD_LOAD: { color: "info", label: "Card load" },
  CARD_UNLOAD: { color: "info", label: "Card unload" },
  TOPUP_FEE: { color: "warning", label: "Top-up fee" },
  WITHDRAW_FEE: { color: "warning", label: "Withdraw fee" },
  MONTHLY_FEE: { color: "error", label: "Monthly fee" },
  REFUND: { color: "success", label: "Refund" },
};

const SHIPMENT_STATUS: Record<string, Mapping> = {
  pending: { color: "warning", label: "Pending payment" },
  processing: { color: "info", label: "Processing" },
  in_production: { color: "violet", label: "In production" },
  shipped: { color: "warning", label: "Shipped" },
  delivered: { color: "success", label: "Delivered" },
  cancelled: { color: "neutral", label: "Cancelled" },
  returned: { color: "neutral", label: "Returned" },
  expired: { color: "error", label: "Expired" },
};

const TICKET_STATUS: Record<string, Mapping> = {
  open: { color: "warning", label: "Open" },
  answered: { color: "info", label: "Answered" },
  closed: { color: "neutral", label: "Closed" },
};

type Kind =
  | "card"
  | "cardType"
  | "deposit"
  | "ledger"
  | "shipment"
  | "ticket"
  | "generic";

const MAPS: Record<Kind, Record<string, Mapping>> = {
  card: CARD_STATUS,
  cardType: CARD_TYPE,
  deposit: DEPOSIT_STATUS,
  ledger: LEDGER_TYPE,
  shipment: SHIPMENT_STATUS,
  ticket: TICKET_STATUS,
  generic: {},
};

interface StatusPillProps {
  status: string;
  kind?: Kind;
  color?: PillColor;
  label?: string;
  dot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  kind = "generic",
  color,
  label,
  dot = true,
}) => {
  const mapping = MAPS[kind][status];
  const c = color ?? mapping?.color ?? "neutral";
  const text = label ?? mapping?.label ?? status;
  const p = PALETTE[c];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 11px",
        borderRadius: 999,
        background: p.bg,
        color: p.fg,
        fontSize: 12.5,
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: p.dot,
            flexShrink: 0,
          }}
        />
      )}
      {text}
    </span>
  );
};
