import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Select, Tooltip, Empty, Progress } from "antd";
import {
  PlusOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  IdcardOutlined,
  ExportOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../providers/axios";
import type { Card, LedgerEntry, ListResult, Me } from "../types";
import { formatMoney } from "../utils/format";
import { CardVisual } from "../components/CardVisual";
import { BRAND } from "../theme";

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${BRAND.borderSubtle}`,
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 4px 14px rgba(16,24,40,.05)",
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return {
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    date: d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
};

const LEDGER_LABEL: Record<string, string> = {
  DEPOSIT: "Balance deposit",
  ADJUSTMENT: "Adjustment",
  ISSUANCE_FEE: "Card issuance fee",
  CARD_LOAD: "Card top-up",
  CARD_UNLOAD: "Card withdrawal",
  TOPUP_FEE: "Top-up fee",
  WITHDRAW_FEE: "Withdrawal fee",
  MONTHLY_FEE: "Monthly fee",
  REFUND: "Refund",
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [month, setMonth] = useState<string>(monthKey(new Date()));

  useEffect(() => {
    Promise.all([
      api.get<Me>("/portal/me"),
      api.get<ListResult<Card>>("/portal/cards", { params: { limit: 100 } }),
      api.get<{ items: LedgerEntry[] }>("/portal/ledger", { params: { limit: 300 } }),
    ])
      .then(([m, c, l]) => {
        setMe(m.data);
        setCards(c.data.items || []);
        setLedger(l.data.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => {
    const set = new Set<string>();
    ledger.forEach((e) => set.add(monthKey(new Date(e.createdAt))));
    set.add(monthKey(new Date()));
    return Array.from(set).sort().reverse();
  }, [ledger]);

  const monthEntries = useMemo(
    () => ledger.filter((e) => monthKey(new Date(e.createdAt)) === month),
    [ledger, month],
  );

  const { series, deposits, spending } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const dep = Array(days + 1).fill(0);
    const spd = Array(days + 1).fill(0);
    let dSum = 0;
    let sSum = 0;
    for (const e of monthEntries) {
      const day = new Date(e.createdAt).getDate();
      const amt = parseFloat(e.amount) || 0;
      if (amt >= 0) {
        dep[day] += amt;
        dSum += amt;
      } else {
        spd[day] += -amt;
        sSum += -amt;
      }
    }
    const series = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      deposits: +dep[i + 1].toFixed(2),
      spending: +spd[i + 1].toFixed(2),
    }));
    return { series, deposits: dSum, spending: sSum };
  }, [monthEntries, month]);

  const activeCard = cards.find((c) => c.status === "ACTIVE") || cards[0];
  const balance = me?.balance ?? "0";
  const currency = me?.currency ?? "USD";

  // Monthly limit widget (spend vs a soft cap).
  const limit = 50000;
  const monthSpend = spending;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* ── Left column ─────────────────────────────────────────── */}
      <div style={{ flex: "1 1 320px", maxWidth: 380, minWidth: 300, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Master balance */}
        <div style={{ ...card, padding: 22, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.textSecondary }}>Master balance</div>
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={hideBalance ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => setHideBalance((v) => !v)}
              style={{ color: BRAND.textMuted }}
            />
          </div>
          <div className="tabular" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: BRAND.textPrimary, marginTop: 4 }}>
            {hideBalance ? "••••••" : formatMoney(balance, currency)}
          </div>
          <button
            onClick={() => navigate("/deposits?new=1")}
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: `1px solid ${BRAND.borderSubtle}`,
              background: BRAND.appBg,
              cursor: "pointer",
              color: BRAND.textPrimary,
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 10, background: BRAND.gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              <PlusOutlined />
            </span>
            Add funds
          </button>
          {/* coin motif */}
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", right: -14, top: 44, opacity: 0.5, pointerEvents: "none" }}>
            <defs>
              <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#E2E8F0" /><stop offset="1" stopColor="#CBD5E1" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="72" rx="34" ry="12" fill="url(#coin)" />
            <ellipse cx="60" cy="60" rx="34" ry="12" fill="#EEF2F8" stroke="#D8E0EA" />
            <text x="60" y="65" textAnchor="middle" fontSize="14" fontWeight="700" fill="#94A3B8">$</text>
          </svg>
        </div>

        {/* My cards */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.textPrimary, marginBottom: 16 }}>My cards</div>
          {loading ? (
            <div className="rc-skel" style={{ height: 150, borderRadius: 16 }} />
          ) : activeCard ? (
            <>
              <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                <Link to={`/cards/${activeCard.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <CardVisual card={activeCard} width="100%" interactive />
                </Link>
                <Tooltip title="Issue a new card">
                  <button
                    onClick={() => navigate("/cards")}
                    style={{ width: 76, borderRadius: 16, border: `1px solid ${BRAND.borderSubtle}`, background: BRAND.appBg, color: BRAND.primary, fontSize: 26, cursor: "pointer" }}
                  >
                    <PlusOutlined />
                  </button>
                </Tooltip>
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18 }}>
                {[
                  { icon: <PlusOutlined />, label: "Top up", to: `/cards/${activeCard.id}` },
                  { icon: <IdcardOutlined />, label: "Details", to: `/cards/${activeCard.id}` },
                  { icon: <ExportOutlined />, label: "Withdraw", to: `/cards/${activeCard.id}` },
                ].map((a) => (
                  <Link key={a.label} to={a.to} style={{ textAlign: "center", color: BRAND.textPrimary }}>
                    <div style={{ width: 46, height: 46, margin: "0 auto", borderRadius: 12, background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {a.icon}
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 6, color: BRAND.textSecondary }}>{a.label}</div>
                  </Link>
                ))}
              </div>

              {/* Conditions / contract */}
              <Link to="/programs">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", marginTop: 8, borderTop: `1px solid ${BRAND.borderSubtle}`, color: BRAND.textPrimary }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}>
                    <SafetyCertificateOutlined style={{ color: me?.contractStatus === "active" ? BRAND.success : BRAND.textMuted }} />
                    Conditions
                  </span>
                  <RightOutlined style={{ fontSize: 11, color: BRAND.textMuted }} />
                </div>
              </Link>

              {/* Monthly limit */}
              <div style={{ padding: "8px 0", borderTop: `1px solid ${BRAND.borderSubtle}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: BRAND.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
                    Monthly spend <ExclamationCircleFilled style={{ color: BRAND.textMuted, fontSize: 12 }} />
                  </span>
                  <span className="tabular" style={{ fontWeight: 600 }}>
                    {formatMoney(monthSpend)} / {formatMoney(limit)}
                  </span>
                </div>
                <Progress percent={Math.min(100, (monthSpend / limit) * 100)} showInfo={false} strokeColor={BRAND.primary} trailColor={BRAND.borderSubtle} size="small" />
              </div>

              {/* Notifications */}
              <Link to="/webhooks">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 2px", borderTop: `1px solid ${BRAND.borderSubtle}`, color: BRAND.textPrimary }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 500 }}>
                    <BellOutlined style={{ color: BRAND.primary }} />
                    Event webhooks
                  </span>
                  <span style={{ color: BRAND.primary, fontWeight: 500, fontSize: 13 }}>Manage <RightOutlined style={{ fontSize: 10 }} /></span>
                </div>
              </Link>
            </>
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              <Empty description="No cards yet" />
              <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => navigate("/cards")}>
                Issue a card
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right column ────────────────────────────────────────── */}
      <div style={{ flex: "3 1 520px", minWidth: 320, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Statistics */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: BRAND.textPrimary }}>Statistics</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: BRAND.textSecondary }}>
                <i style={{ width: 9, height: 9, borderRadius: 3, background: "#C7D2FE", display: "inline-block" }} />
                Deposits <b className="tabular" style={{ color: BRAND.textPrimary }}>+{formatMoney(deposits)}</b>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: BRAND.textSecondary }}>
                <i style={{ width: 9, height: 9, borderRadius: 3, background: BRAND.primary, display: "inline-block" }} />
                Spending <b className="tabular" style={{ color: BRAND.textPrimary }}>-{formatMoney(spending)}</b>
              </span>
            </div>
            <Select
              value={month}
              onChange={setMonth}
              style={{ width: 180 }}
              options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
            />
          </div>
          {loading ? (
            <div className="rc-skel" style={{ height: 260, borderRadius: 12 }} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A5B4FC" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#A5B4FC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: BRAND.textMuted }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: BRAND.textMuted }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `$${v}`} />
                <RTooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div style={{ background: "#0F172A", color: "#fff", borderRadius: 10, padding: "8px 12px", fontSize: 12 }}>
                        <div style={{ opacity: 0.7 }}>Day {label}</div>
                        <div>Deposits: {formatMoney(payload.find((p) => p.dataKey === "deposits")?.value as number)}</div>
                        <div>Spending: {formatMoney(payload.find((p) => p.dataKey === "spending")?.value as number)}</div>
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="deposits" stroke="#A5B4FC" strokeWidth={2} fill="url(#dep)" dot={false} />
                <Area type="monotone" dataKey="spending" stroke={BRAND.primary} strokeWidth={2.5} fill="transparent" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transactions */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px", gap: 12, padding: "16px 24px", color: BRAND.textMuted, fontSize: 13, borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
            <span>Description</span>
            <span>Time</span>
            <span>Card</span>
            <span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[0, 1, 2, 3].map((i) => <div key={i} className="rc-skel" style={{ height: 40, borderRadius: 8, marginBottom: 10 }} />)}
            </div>
          ) : monthEntries.length === 0 ? (
            <div style={{ padding: 48 }}><Empty description="No activity this month" /></div>
          ) : (
            monthEntries.slice(0, 40).map((e) => {
              const amt = parseFloat(e.amount) || 0;
              const positive = amt >= 0;
              const t = timeOf(e.createdAt);
              const isCard = e.type === "ISSUANCE_FEE" && /issued|issuance/i.test(e.description || "");
              return (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px", gap: 12, padding: "14px 24px", borderBottom: `1px solid ${BRAND.borderSubtle}`, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: positive ? BRAND.successSoft : BRAND.appBg, color: positive ? BRAND.success : BRAND.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                      {isCard ? <CreditCardOutlined /> : positive ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                    </span>
                    <span style={{ fontWeight: 500, color: BRAND.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.description || LEDGER_LABEL[e.type] || e.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <div className="tabular" style={{ color: BRAND.textPrimary }}>{t.time}</div>
                    <div style={{ color: BRAND.textMuted, fontSize: 12 }}>{t.date}</div>
                  </div>
                  <div className="tabular" style={{ color: BRAND.textSecondary, fontSize: 13 }}>
                    {e.cardId ? (
                      <Link to={`/cards/${e.cardId}`} style={{ color: BRAND.textSecondary }}>
                        •••• <ExportOutlined style={{ fontSize: 11, color: BRAND.primary }} />
                      </Link>
                    ) : "—"}
                  </div>
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
  );
};
