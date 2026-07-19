export type LedgerType =
  | "DEPOSIT"
  | "ADJUSTMENT"
  | "ISSUANCE_FEE"
  | "CARD_LOAD"
  | "CARD_UNLOAD"
  | "TOPUP_FEE"
  | "WITHDRAW_FEE"
  | "MONTHLY_FEE"
  | "REFUND";

export type CardStatus = "ACTIVE" | "FROZEN" | "RELEASED" | "FAILED";

export type CardType = "VIRTUAL" | "PHYSICAL";

export type DepositStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "expired";

export type FundingNetwork = "trc20" | "bep20" | "erc20";

export interface ShippingAddress {
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Me {
  id: string;
  email: string;
  companyName: string;
  contactName?: string;
  phone?: string;
  country?: string;
  status?: string;
  balance?: string;
  currency?: string;
}

export interface LedgerEntry {
  id: string;
  clientId?: string;
  cardId?: string | null;
  type: LedgerType;
  amount: string;
  currency: string;
  balanceAfter: string;
  description?: string | null;
  reference?: string | null;
  meta?: unknown;
  createdAt: string;
}

export interface DashboardData {
  balance: string;
  currency: string;
  activeCards: number;
  totalCards: number;
  programs: number;
  recentLedger: LedgerEntry[];
}

export interface Program {
  id: string;
  name: string;
  description?: string | null;
  bin?: string | null;
  network?: string | null;
  cardType?: CardType | null;
  shippingFee?: string | null;
  currency: string;
  issuanceFee?: string | null;
  topupFeePercent?: string | null;
  withdrawFeePercent?: string | null;
  minTopup?: string | null;
  maxTopup?: string | null;
  minInitialLoad?: string | null;
  artworkSvg?: string | null;
  cardColor?: string | null;
  physicalStock?: number | null;
  inStock?: boolean;
}

export interface Card {
  id: string;
  programId: string;
  program?: {
    id: string;
    name: string;
    bin?: string | null;
    artworkSvg?: string | null;
    cardColor?: string | null;
  };
  maskedPan: string;
  last4?: string;
  network?: string | null;
  cardType?: CardType | null;
  currency: string;
  expDate?: string | null;
  status: CardStatus;
  balance: string;
  holderEmail?: string | null;
  holderPhone?: string | null;
  label?: string | null;
  deliveryStatus?: string | null;
  trackingNumber?: string | null;
  shipping?: ShippingAddress | null;
  activationCode?: string | null;
  activationPin?: string | null;
  activatedAt?: string | null;
  createdAt: string;
}

export interface CardSecrets {
  id: string;
  cardNumber: string;
  cvv: string;
  expDate: string;
  holderEmail?: string | null;
  balance: string;
  status: CardStatus;
  currency: string;
}

export interface CardTransaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  merchant?: string | null;
  status: string;
  occurredAt: string;
}

export interface MoneyMovementResult {
  cardId: string;
  amount: string;
  fee: string;
  requestId: string;
  status: string;
}

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  scopes?: string[];
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface CreatedApiKey {
  id: string;
  label: string;
  prefix: string;
  key: string;
}

export interface Deposit {
  id: string;
  amount: string;
  currency: string;
  network: FundingNetwork | string;
  asset: string;
  cryptoAmount: string;
  payAddress: string;
  status: DepositStatus;
  expiresAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ListResult<T> {
  total: number;
  items: T[];
}

export type ShipmentStatus =
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface ShipmentEvent {
  status: string;
  note: string;
  at: string;
}

export interface Shipment {
  id: string;
  cardId: string;
  card?: { id: string; maskedPan?: string | null; last4?: string | null };
  program?: { id: string; name: string };
  recipientName?: string | null;
  address?: ShippingAddress | null;
  status: ShipmentStatus;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  events?: ShipmentEvent[] | null;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

export type TicketStatus = "open" | "answered" | "closed";

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorType: "client" | "admin";
  authorName?: string | null;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages?: TicketMessage[];
  _count?: { messages: number };
}
