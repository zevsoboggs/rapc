import type { LedgerType } from "../types";
import { StatusPill } from "./StatusPill";

export const LedgerTag: React.FC<{ type: LedgerType | string }> = ({ type }) => (
  <StatusPill status={type} kind="ledger" />
);
