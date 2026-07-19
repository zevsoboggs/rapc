import type { DepositStatus } from "../types";
import { StatusPill } from "./StatusPill";

export const DepositStatusTag: React.FC<{ status: DepositStatus | string }> = ({
  status,
}) => <StatusPill status={status} kind="deposit" />;
