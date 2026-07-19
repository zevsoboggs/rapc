import type { CardStatus } from "../types";
import { StatusPill } from "./StatusPill";

export const CardStatusTag: React.FC<{ status: CardStatus | string }> = ({
  status,
}) => <StatusPill status={status} kind="card" />;
