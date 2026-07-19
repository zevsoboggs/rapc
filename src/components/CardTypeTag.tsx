import type { CardType } from "../types";
import { StatusPill } from "./StatusPill";

export const CardTypeTag: React.FC<{ cardType?: CardType | string | null }> = ({
  cardType,
}) => {
  if (!cardType) return <>—</>;
  return <StatusPill status={cardType} kind="cardType" />;
};
