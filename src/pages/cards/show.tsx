import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Input,
  Popconfirm,
  Alert,
  Drawer,
  Progress,
  Empty,
  Tooltip,
  App as AntdApp,
} from "antd";
import {
  PlusOutlined,
  ExportOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  DownOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  BellOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  ExclamationCircleFilled,
  CloseOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { api } from "../../providers/axios";
import type {
  Card,
  CardSecrets,
  CardTransaction,
  ListResult,
  MoneyMovementResult,
} from "../../types";
import { formatMoney } from "../../utils/format";
import { CardVisualSkeleton, TableSkeleton } from "../../components/Skeletons";
import { CopyField, CopyInfoRow, copyText } from "../../components/CopyField";
import { svgUrl } from "../../components/ProgramTile";
import { BRAND, CARD_SHADOW } from "../../theme";

const cardBox: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${BRAND.borderSubtle}`,
  boxShadow: CARD_SHADOW,
  borderRadius: 18,
};

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return {
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    date: d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }),
    full: d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
};

const TX_LABEL: Record<string, string> = {
  DEPOSIT: "Card top-up",
  CARD_LOAD: "Card top-up",
  TOP_UP: "Card top-up",
  TOPUP: "Card top-up",
  CARD_UNLOAD: "Withdrawal",
  WITHDRAW: "Withdrawal",
  ISSUANCE: "Card issued",
  ISSUE: "Card issued",
  PURCHASE: "Purchase",
  PAYMENT: "Purchase",
};

function txLabel(t: CardTransaction): string {
  return t.merchant || TX_LABEL[(t.type || "").toUpperCase()] || t.type || "Transaction";
}

function isIssue(t: CardTransaction): boolean {
  return /issu/i.test(t.type || "") || /issu/i.test(t.merchant || "");
}

// Small network glyph (Mastercard rings / VISA wordmark) for the pastel face.
const NetMark: React.FC<{ network?: string | null }> = ({ network }) => {
  if ((network || "").toUpperCase().includes("MASTER")) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EB001B", display: "inline-block" }} />
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#F79E1B", marginLeft: -8, opacity: 0.85, display: "inline-block" }} />
      </span>
    );
  }
  return <span style={{ fontStyle: "italic", fontWeight: 800, fontSize: 15, color: "#1e293b" }}>VISA</span>;
};

export const CardShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  const [secrets, setSecrets] = useState<CardSecrets | null>(null);
  const [revealing, setRevealing] = useState(false);

  const [txns, setTxns] = useState<CardTransaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);

  const [topupOpen, setTopupOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<CardTransaction | null>(null);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [defaultId, setDefaultId] = useState<string | null>(() => localStorage.getItem("rc-default-card"));

  const [topupForm] = Form.useForm<{ amount: number }>();
  const [withdrawForm] = Form.useForm<{ amount: number }>();
  const [emailForm] = Form.useForm<{ email: string }>();
  const [phoneForm] = Form.useForm<{ zoneNumber: string; phoneNumber: string }>();

  const loadCard = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Card>(`/portal/cards/${id}`)
      .then((res) => setCard(res.data))
      .catch(() => message.error("Failed to load card."))
      .finally(() => setLoading(false));
  }, [id, message]);

  const loadTxns = useCallback(() => {
    if (!id) return;
    setTxnLoading(true);
    api
      .get<ListResult<CardTransaction>>(`/portal/cards/${id}/transactions`, { params: { limit: 100 } })
      .then((res) => setTxns(res.data.items ?? []))
      .catch(() => message.error("Failed to load transactions."))
      .finally(() => setTxnLoading(false));
  }, [id, message]);

  useEffect(() => { loadCard(); }, [loadCard]);
  useEffect(() => { loadTxns(); }, [loadTxns]);

  const reveal = useCallback(async () => {
    if (!id) return;
    setRevealing(true);
    try {
      const { data } = await api.get<CardSecrets>(`/portal/cards/${id}/secrets`);
      setSecrets(data);
    } catch {
      message.error("Failed to reveal card details.");
    } finally {
      setRevealing(false);
    }
  }, [id, message]);

  const openData = () => {
    setDataOpen(true);
    if (!secrets && card?.status !== "RELEASED") reveal();
  };

  const doTopup = async (values: { amount: number }) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const { data } = await api.post<MoneyMovementResult>(`/portal/cards/${id}/topup`, { amount: String(values.amount) });
      message.success(`Top-up submitted. Amount ${formatMoney(data.amount)}, fee ${formatMoney(data.fee)}.`);
      setTopupOpen(false);
      topupForm.resetFields();
      loadCard();
      loadTxns();
    } catch (err: unknown) {
      message.error(errMsg(err, "Top-up failed."));
    } finally {
      setActionLoading(false);
    }
  };

  const doWithdraw = async (values: { amount: number }) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const { data } = await api.post<MoneyMovementResult>(`/portal/cards/${id}/withdraw`, { amount: String(values.amount) });
      message.success(`Withdrawal submitted. Amount ${formatMoney(data.amount)}, fee ${formatMoney(data.fee)}.`);
      setWithdrawOpen(false);
      withdrawForm.resetFields();
      loadCard();
      loadTxns();
    } catch (err: unknown) {
      message.error(errMsg(err, "Withdrawal failed."));
    } finally {
      setActionLoading(false);
    }
  };

  const doRelease = async () => {
    if (!id) return;
    try {
      await api.post(`/portal/cards/${id}/release`);
      message.success("Card closed. Remaining balance returned.");
      setSecrets(null);
      loadCard();
      loadTxns();
    } catch (err: unknown) {
      message.error(errMsg(err, "Failed to close card."));
    }
  };

  const doEmail = async (values: { email: string }) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post(`/portal/cards/${id}/email`, { email: values.email });
      message.success("Holder email updated.");
      setEmailOpen(false);
      emailForm.resetFields();
      loadCard();
    } catch (err: unknown) {
      message.error(errMsg(err, "Failed to update email."));
    } finally {
      setActionLoading(false);
    }
  };

  const doPhone = async (values: { zoneNumber: string; phoneNumber: string }) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post(`/portal/cards/${id}/phone`, { zoneNumber: values.zoneNumber, phoneNumber: values.phoneNumber });
      message.success("Holder phone updated.");
      setPhoneOpen(false);
      phoneForm.resetFields();
      loadCard();
    } catch (err: unknown) {
      message.error(errMsg(err, "Failed to update phone."));
    } finally {
      setActionLoading(false);
    }
  };

  const monthSpend = useMemo(() => {
    const now = new Date();
    return txns.reduce((s, t) => {
      const d = new Date(t.occurredAt);
      const amt = parseFloat(t.amount) || 0;
      if (amt < 0 && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) return s + -amt;
      return s;
    }, 0);
  }, [txns]);

  if (loading) {
    return (
      <div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}>
          <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={() => navigate("/cards")} />
          <span style={{ fontSize: 26, fontWeight: 800 }}>Card</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 340px", maxWidth: 400 }}><CardVisualSkeleton width="100%" /></div>
          <div style={{ flex: "2 1 460px" }}><div style={cardBox}><div style={{ padding: 24 }}><TableSkeleton rows={5} cols={3} /></div></div></div>
        </div>
      </div>
    );
  }

  if (!card) return <Alert type="error" showIcon message="Card not found." />;

  const isReleased = card.status === "RELEASED";
  const limit = 50000;
  const title = card.label || card.program?.name || "Card";
  const art = svgUrl(card.program?.artworkSvg);
  const balancePastel = card.program?.cardColor && card.program.cardColor.includes("gradient")
    ? card.program.cardColor
    : "linear-gradient(135deg, #c6d2fb 0%, #dfd3f4 100%)";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
        <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={() => navigate("/cards")} />
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: BRAND.textPrimary }}>{title}</span>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left panel */}
        <div style={{ flex: "1 1 340px", maxWidth: 400, minWidth: 300 }}>
          <div style={{ ...cardBox, padding: 20 }}>
            {/* Balance face */}
            {art ? (
              // Real artwork is a complete card design — show it clean, with the
              // balance and chips presented above it (no overlay collisions).
              <div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: BRAND.textMuted }}>Balance</div>
                    <div className="tabular" style={{ fontSize: 30, fontWeight: 800, color: BRAND.textPrimary, letterSpacing: "-0.02em" }}>
                      {formatMoney(card.balance, card.currency)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 600, color: BRAND.textPrimary }}>•{card.last4 || card.maskedPan?.slice(-4) || "0000"}</span>
                    <span style={{ background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: BRAND.textSecondary }}>{card.currency}</span>
                  </div>
                </div>
                <div style={{ width: "100%", aspectRatio: "1.586 / 1", borderRadius: 16, overflow: "hidden", backgroundImage: art, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 14px 34px -14px rgba(15,23,42,.5)", filter: isReleased ? "grayscale(.7) opacity(.7)" : undefined }} />
              </div>
            ) : (
              // Pastel face with the balance overlaid (mockup style).
              <div style={{ position: "relative", borderRadius: 16, background: balancePastel, padding: "22px 22px 18px", minHeight: 176, display: "flex", flexDirection: "column", justifyContent: "space-between", filter: isReleased ? "grayscale(.7) opacity(.7)" : undefined }}>
                <div className="tabular" style={{ fontSize: 30, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em" }}>
                  {formatMoney(card.balance, card.currency)}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "rgba(255,255,255,.7)", borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>•{card.last4 || card.maskedPan?.slice(-4) || "0000"}</span>
                    <span style={{ background: "rgba(255,255,255,.7)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#334155" }}>{card.currency}</span>
                  </div>
                  <NetMark network={card.network} />
                </div>
              </div>
            )}

            {/* Action row */}
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18 }}>
              {[
                { icon: <PlusOutlined />, label: "Top up", onClick: () => setTopupOpen(true) },
                { icon: <IdcardOutlined />, label: "Card data", onClick: openData },
                { icon: <ExportOutlined />, label: "Withdraw", onClick: () => setWithdrawOpen(true) },
              ].map((a) => (
                <button key={a.label} disabled={isReleased} onClick={a.onClick} style={{ background: "none", border: "none", cursor: isReleased ? "not-allowed" : "pointer", textAlign: "center", opacity: isReleased ? 0.5 : 1 }}>
                  <div style={{ width: 48, height: 48, margin: "0 auto", borderRadius: 12, background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: BRAND.textPrimary }}>
                    {a.icon}
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 7, color: BRAND.textSecondary }}>{a.label}</div>
                </button>
              ))}
            </div>

            {/* Conditions */}
            <button onClick={() => setConditionsOpen((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4px", marginTop: 8, borderTop: `1px solid ${BRAND.borderSubtle}`, color: BRAND.textPrimary, fontWeight: 500, fontSize: 15 }}>
              <span>Conditions</span>
              {conditionsOpen ? <DownOutlined style={{ fontSize: 12, color: BRAND.textMuted }} /> : <RightOutlined style={{ fontSize: 12, color: BRAND.textMuted }} />}
            </button>
            {conditionsOpen && (
              <div style={{ padding: "0 4px 14px", fontSize: 13.5, color: BRAND.textSecondary }}>
                <Row label="Program" value={card.program?.name ?? "—"} />
                <Row label="Type" value={card.cardType === "PHYSICAL" ? "Physical" : "Virtual"} />
                <Row label="Network" value={card.network || "—"} />
                <Row label="Expiry" value={card.expDate ? String(card.expDate).slice(0, 7) : "—"} />
              </div>
            )}

            {/* Monthly limit */}
            <div style={{ padding: "14px 4px", borderTop: `1px solid ${BRAND.borderSubtle}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: BRAND.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
                  Monthly limit <ExclamationCircleFilled style={{ color: BRAND.textMuted, fontSize: 12 }} />
                </span>
                <span className="tabular" style={{ fontWeight: 600 }}>{formatMoney(monthSpend)} / {formatMoney(limit)}</span>
              </div>
              <Progress percent={Math.min(100, (monthSpend / limit) * 100)} showInfo={false} strokeColor={BRAND.primary} trailColor={BRAND.borderSubtle} size="small" />
            </div>

            {/* Notifications */}
            <Link to="/webhooks">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4px", borderTop: `1px solid ${BRAND.borderSubtle}`, color: BRAND.textPrimary }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}>
                  <BellOutlined style={{ color: BRAND.primary }} /> Card notifications
                </span>
                <span style={{ color: BRAND.primary, fontWeight: 500, fontSize: 13 }}>Settings <RightOutlined style={{ fontSize: 10 }} /></span>
              </div>
            </Link>

            {/* Set as default */}
            <div style={{ padding: "16px 4px 4px", borderTop: `1px solid ${BRAND.borderSubtle}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, color: BRAND.textPrimary }}>Set as default</span>
                {defaultId === card.id ? (
                  <span style={{ color: BRAND.success, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircleFilled /> Selected
                  </span>
                ) : (
                  <button onClick={() => { localStorage.setItem("rc-default-card", card.id); setDefaultId(card.id); message.success("Set as default card."); }} style={{ background: "none", border: "none", color: BRAND.primary, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    Select
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginTop: 6 }}>
                This card will be shown by default on the home page.
              </div>
            </div>

            {/* Close card */}
            <Popconfirm
              title="Close this card?"
              description="The card will be permanently closed and any remaining balance returned to your account."
              okText="Close card"
              okButtonProps={{ danger: true }}
              onConfirm={doRelease}
              disabled={isReleased}
            >
              <Button block danger disabled={isReleased} style={{ marginTop: 16, height: 46, borderRadius: 12 }}>
                Close card
              </Button>
            </Popconfirm>
          </div>
        </div>

        {/* Right: delivery (physical) + transactions */}
        <div style={{ flex: "2 1 460px", minWidth: 320 }}>
          {card.cardType === "PHYSICAL" && (
            <div style={{ ...cardBox, padding: 22, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.textPrimary, marginBottom: 6 }}>Delivery</div>
              <DeliveryRow label="Status" value={DELIVERY_LABEL[card.deliveryStatus || ""] || card.deliveryStatus || "Not shipped yet"} />
              <DeliveryRow label="Tracking number" value={card.trackingNumber || "Not shipped yet"} mono copyable={!!card.trackingNumber} />
              {card.activationCode && <DeliveryRow label="Activation code" value={card.activationCode} mono copyable />}
              {card.activationPin && <DeliveryRow label="Activation PIN" value={card.activationPin} mono />}
              {card.shipping?.recipientName && <DeliveryRow label="Recipient" value={card.shipping.recipientName} />}
              {card.shipping && (
                <DeliveryRow
                  label="Address"
                  value={[card.shipping.line1, card.shipping.line2, card.shipping.city, card.shipping.state, card.shipping.postalCode, card.shipping.country].filter(Boolean).join(", ")}
                />
              )}
            </div>
          )}
          <div style={{ ...cardBox, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 120px", gap: 12, padding: "16px 24px", color: BRAND.textMuted, fontSize: 13, borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
              <span>Description</span><span>Time</span><span>Card</span><span style={{ textAlign: "right" }}>Amount</span>
            </div>
            {txnLoading ? (
              <div style={{ padding: 24 }}>{[0, 1, 2, 3].map((i) => <div key={i} className="rc-skel" style={{ height: 40, borderRadius: 8, marginBottom: 10 }} />)}</div>
            ) : txns.length === 0 ? (
              <div style={{ padding: 56 }}><Empty description="No transactions yet" /></div>
            ) : (
              txns.map((t) => {
                const amt = parseFloat(t.amount) || 0;
                const positive = amt >= 0;
                const tm = timeOf(t.occurredAt);
                const issue = isIssue(t);
                return (
                  <div key={t.id} onClick={() => setActiveTx(t)} style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 120px", gap: 12, padding: "14px 24px", borderBottom: `1px solid ${BRAND.borderSubtle}`, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: issue ? BRAND.appBg : positive ? BRAND.successSoft : BRAND.appBg, color: issue ? BRAND.textSecondary : positive ? BRAND.success : BRAND.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                        {issue ? <CreditCardOutlined /> : positive ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                      </span>
                      <span style={{ fontWeight: 500, color: BRAND.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{txLabel(t)}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <div className="tabular" style={{ color: BRAND.textPrimary }}>{tm.time}</div>
                      <div style={{ color: BRAND.textMuted, fontSize: 12 }}>{tm.date}</div>
                    </div>
                    <div className="tabular" style={{ color: BRAND.textSecondary, fontSize: 13 }}>•{card.last4 || card.maskedPan?.slice(-4)}</div>
                    <div className="tabular" style={{ textAlign: "right", fontWeight: 700, color: positive ? BRAND.success : BRAND.textPrimary }}>
                      {positive ? "+" : "-"}{formatMoney(Math.abs(amt))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Card data drawer ─────────────────────────────────── */}
      <Drawer
        title="Card data"
        placement="right"
        width={480}
        open={dataOpen}
        onClose={() => setDataOpen(false)}
        closeIcon={<CloseOutlined />}
      >
        {/* Balance pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: "10px 16px", marginBottom: 16 }}>
          <span className="tabular" style={{ fontSize: 18, fontWeight: 700, color: BRAND.textPrimary }}>{formatMoney(card.balance, card.currency)}</span>
          <span style={{ background: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 12, fontWeight: 700, color: "#334155", border: `1px solid ${BRAND.borderSubtle}` }}>{card.currency}</span>
          <NetMark network={card.network} />
        </div>

        <button
          onClick={() => navigate("/support")}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: "14px 16px", marginBottom: 22, cursor: "pointer" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: BRAND.textPrimary, fontWeight: 500 }}>
            <InfoCircleOutlined style={{ color: BRAND.primary }} /> How to avoid declines?
          </span>
          <RightOutlined style={{ fontSize: 12, color: BRAND.textMuted }} />
        </button>

        {/* Card details / requisites */}
        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>Card details</div>
        {isReleased ? (
          <Alert type="warning" showIcon message="This card is closed." style={{ marginBottom: 20 }} />
        ) : !secrets ? (
          <div style={{ marginBottom: 20 }}>
            <Button type="primary" block loading={revealing} onClick={reveal} style={{ height: 46, borderRadius: 12 }}>Reveal card details</Button>
          </div>
        ) : (
          <Space direction="vertical" size={10} style={{ width: "100%", marginBottom: 22 }}>
            <CopyField value={formatCardNumber(secrets.cardNumber)} mono label="Card number" />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><CopyField value={secrets.expDate} mono label="Expiry" /></div>
              <div style={{ flex: 1 }}><CopyField value={secrets.cvv} mono label="CVV" /></div>
            </div>
            <CopyField value={holderName(card) || secrets.holderEmail || undefined} label="Cardholder" placeholder="—" />
          </Space>
        )}

        {/* Additional information */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
          Additional information <InfoCircleOutlined style={{ fontWeight: 400 }} />
        </div>
        <CopyInfoRow label="Email" value={card.holderEmail || secrets?.holderEmail} />
        <CopyInfoRow label="Phone" value={card.holderPhone || card.shipping?.phone} />
        <CopyInfoRow label="Zipcode" value={card.shipping?.postalCode} />
        <CopyInfoRow label="Address" value={card.shipping ? [card.shipping.line1, card.shipping.line2].filter(Boolean).join(", ") : undefined} />
        <CopyInfoRow label="First name" value={firstName(card)} />
        <CopyInfoRow label="Last name" value={lastName(card)} />
      </Drawer>

      {/* ── Transaction details drawer ───────────────────────── */}
      <Drawer
        title="Details"
        placement="right"
        width={460}
        open={!!activeTx}
        onClose={() => setActiveTx(null)}
        closeIcon={<CloseOutlined />}
        footer={
          <Button block onClick={() => setActiveTx(null)} style={{ height: 48, borderRadius: 12, background: "#0f172a", color: "#fff", border: "none", fontWeight: 600 }}>
            Close
          </Button>
        }
      >
        {activeTx && (() => {
          const amt = parseFloat(activeTx.amount) || 0;
          const positive = amt >= 0;
          const issue = isIssue(activeTx);
          const tm = timeOf(activeTx.occurredAt);
          return (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 76, height: 76, borderRadius: "50%", margin: "0 auto 16px", background: issue ? BRAND.appBg : positive ? BRAND.successSoft : BRAND.appBg, color: issue ? BRAND.textSecondary : positive ? BRAND.success : BRAND.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                  {issue ? <CreditCardOutlined /> : positive ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, color: BRAND.textPrimary }}>{txLabel(activeTx)}</div>
                <div className="tabular" style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: positive ? BRAND.success : BRAND.textPrimary }}>
                  {positive ? "+" : "-"}{formatMoney(Math.abs(amt))}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: BRAND.successSoft, color: BRAND.success, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircleFilled /> {activeTx.status === "declined" || activeTx.status === "failed" ? "Failed" : "Completed"}
                </div>
              </div>

              <div style={{ background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Transaction ID</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="tabular" style={{ fontFamily: "monospace", fontSize: 13.5, color: BRAND.textPrimary, wordBreak: "break-all" }}>{activeTx.id}</span>
                    <Tooltip title="Copy"><Button type="text" size="small" shape="circle" icon={<CopyOutlined style={{ color: BRAND.textMuted }} />} onClick={() => copyText(activeTx.id, "Transaction ID", (m) => message.success(m))} /></Tooltip>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Card number</div>
                  <div className="tabular" style={{ fontFamily: "monospace", fontSize: 14, color: BRAND.textPrimary }}>{card.maskedPan}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Date</div>
                  <div className="tabular" style={{ fontSize: 14, color: BRAND.textPrimary }}>{tm.full}</div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, color: BRAND.textPrimary, marginBottom: 8 }}>Comment</div>
                <Input.TextArea rows={3} placeholder="Add a comment…" id={`cmt-${activeTx.id}`} />
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <Button type="text" style={{ color: BRAND.primary }} onClick={() => message.success("Comment saved.")}>Save</Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* Top up */}
      <Modal title="Top up card" open={topupOpen} onCancel={() => setTopupOpen(false)} onOk={() => topupForm.submit()} okText="Top up" confirmLoading={actionLoading} destroyOnClose>
        <Form form={topupForm} layout="vertical" onFinish={doTopup}>
          <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Please enter an amount" }]} extra="A top-up fee may apply based on your program.">
            <InputNumber style={{ width: "100%" }} min={0} step={10} prefix="$" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdraw */}
      <Modal title="Withdraw from card" open={withdrawOpen} onCancel={() => setWithdrawOpen(false)} onOk={() => withdrawForm.submit()} okText="Withdraw" confirmLoading={actionLoading} destroyOnClose>
        <Form form={withdrawForm} layout="vertical" onFinish={doWithdraw}>
          <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Please enter an amount" }]} extra="A withdrawal fee may apply based on your program.">
            <InputNumber style={{ width: "100%" }} min={0} step={10} prefix="$" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Email + phone editors, reachable via Card data flows */}
      <Modal title="Update holder email" open={emailOpen} onCancel={() => setEmailOpen(false)} onOk={() => emailForm.submit()} okText="Save" confirmLoading={actionLoading} destroyOnClose>
        <Form form={emailForm} layout="vertical" onFinish={doEmail} initialValues={{ email: card.holderEmail ?? "" }}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Please enter an email" }, { type: "email", message: "Enter a valid email" }]}>
            <Input placeholder="holder@company.com" prefix={<MailOutlined />} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Update holder phone" open={phoneOpen} onCancel={() => setPhoneOpen(false)} onOk={() => phoneForm.submit()} okText="Save" confirmLoading={actionLoading} destroyOnClose>
        <Form form={phoneForm} layout="vertical" onFinish={doPhone} initialValues={{ zoneNumber: "+48" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item label="Zone" name="zoneNumber" rules={[{ required: true, message: "Required" }]} style={{ width: 100 }}>
              <Input placeholder="+48" prefix={<PhoneOutlined />} />
            </Form.Item>
            <Form.Item label="Phone number" name="phoneNumber" rules={[{ required: true, message: "Please enter a phone number" }]} style={{ flex: 1 }}>
              <Input placeholder="123456789" />
            </Form.Item>
          </Space.Compact>
        </Form>
      </Modal>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
    <span style={{ color: BRAND.textMuted }}>{label}</span>
    <span style={{ fontWeight: 500, color: BRAND.textPrimary }}>{value}</span>
  </div>
);

const DELIVERY_LABEL: Record<string, string> = {
  pending: "Order placed",
  processing: "Preparing",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const DeliveryRow: React.FC<{ label: string; value: string; mono?: boolean; copyable?: boolean }> = ({ label, value, mono, copyable }) => {
  const { message } = AntdApp.useApp();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 0", borderTop: `1px solid ${BRAND.borderSubtle}` }}>
      <span style={{ color: BRAND.textMuted, fontSize: 14 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span className={mono ? "tabular" : undefined} style={{ fontFamily: mono ? "monospace" : undefined, fontWeight: 600, color: BRAND.textPrimary, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
        {copyable && (
          <Tooltip title="Copy">
            <Button type="text" size="small" shape="circle" icon={<CopyOutlined style={{ color: BRAND.textMuted }} />} onClick={() => copyText(value, label, (m) => message.success(m))} />
          </Tooltip>
        )}
      </span>
    </div>
  );
};

function formatCardNumber(n?: string | null): string {
  if (!n) return "";
  return n.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function holderName(card: Card): string | undefined {
  return card.shipping?.recipientName || undefined;
}
function firstName(card: Card): string | undefined {
  const n = holderName(card);
  return n ? n.split(" ")[0] : undefined;
}
function lastName(card: Card): string | undefined {
  const n = holderName(card);
  if (!n) return undefined;
  const parts = n.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : undefined;
}

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}
