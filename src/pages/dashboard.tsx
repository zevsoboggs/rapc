import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Row, Col, Button, Empty, Alert } from "antd";
import {
  WalletOutlined,
  CreditCardOutlined,
  IdcardOutlined,
  AppstoreOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { api } from "../providers/axios";
import type { DashboardData, Card, ListResult, ContractStatus } from "../types";
import { formatMoney, formatDay } from "../utils/format";
import { LedgerTable } from "../components/LedgerTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { TrendAreaChart, DonutChart, ChartLegend } from "../components/Charts";
import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  CardVisualSkeleton,
} from "../components/Skeletons";
import { BRAND } from "../theme";

const ContractHero: React.FC<{
  status?: ContractStatus;
  number?: string | null;
  signedAt?: string | null;
}> = ({ status, number, signedAt }) => {
  const active = status === "active";
  const suspended = status === "suspended";

  if (active) {
    return (
      <div
        style={{
          background: BRAND.gradient,
          color: "#fff",
          borderRadius: 16,
          padding: "22px 26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(255,255,255,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.85 }}>
              Platform contract
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Card access enabled
            </div>
            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 2 }}>
              Your contract is active — you can issue and manage cards.
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 150 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Contract</div>
          <div className="tabular" style={{ fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>
            {number || "—"}
          </div>
          {signedAt && (
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              Signed {formatDay(signedAt)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // No contract / suspended → gated
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${suspended ? "#FDE68A" : "#FECACA"}`,
        borderLeft: `4px solid ${suspended ? BRAND.warning : BRAND.error}`,
        borderRadius: 16,
        padding: "22px 26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: suspended ? BRAND.warningSoft : BRAND.errorSoft,
            color: suspended ? BRAND.warning : BRAND.error,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          <WarningOutlined />
        </div>
        <div>
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: BRAND.textMuted }}>
            Platform contract
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.textPrimary, letterSpacing: "-0.01em" }}>
            {suspended ? "Card access suspended" : "Card access not enabled"}
          </div>
          <div style={{ fontSize: 13.5, color: BRAND.textSecondary, marginTop: 2, maxWidth: 560 }}>
            {suspended
              ? "Your contract is on hold, so card issuance is temporarily paused. Contact your account manager to restore access."
              : "Issuing and managing cards requires a signed platform contract. Contact your account manager to sign a contract and unlock card access."}
          </div>
        </div>
      </div>
      <Link to="/support">
        <Button type="primary" icon={<MessageOutlined />} danger={!suspended}>
          Contact manager
        </Button>
      </Link>
    </div>
  );
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  FROZEN: "Frozen",
  RELEASED: "Closed",
  FAILED: "Failed",
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<DashboardData>("/portal/dashboard"),
      api.get<ListResult<Card>>("/portal/cards", { params: { limit: 100 } }),
    ])
      .then(([d, c]) => {
        if (!active) return;
        setData(d.data);
        setCards(c.data.items || []);
      })
      .catch(() => active && setError("Failed to load dashboard data."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Balance trend from recent ledger (chronological).
  const trend = (data?.recentLedger ?? [])
    .slice()
    .reverse()
    .map((e) => ({
      label: new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: parseFloat(e.balanceAfter) || 0,
    }));

  // Cards by status donut.
  const statusCounts = (cards ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const donut = Object.entries(statusCounts).map(([k, v]) => ({
    label: STATUS_LABELS[k] || k,
    value: v,
  }));

  const previewCards = (cards ?? []).filter((c) => c.status === "ACTIVE").slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your account balance and card activity."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/deposits?new=1")}>
            Add funds
          </Button>
        }
      />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} />}

      {/* Contract / card-access hero */}
      {!loading && data && (
        <div style={{ marginBottom: 20 }}>
          <ContractHero
            status={data.contractStatus}
            number={data.contractNumber}
            signedAt={data.contractSignedAt}
          />
        </div>
      )}

      {/* Stat row */}
      <Row gutter={[20, 20]}>
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <Col xs={24} sm={12} xl={6} key={i}>
              <StatCardSkeleton />
            </Col>
          ))
        ) : (
          <>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                tint="blue"
                icon={<WalletOutlined />}
                label="Available Balance"
                value={formatMoney(data!.balance, data!.currency)}
                footer={
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/deposits?new=1")}
                  >
                    Add funds
                  </Button>
                }
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard tint="green" icon={<CreditCardOutlined />} label="Active Cards" value={data!.activeCards} />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard tint="violet" icon={<IdcardOutlined />} label="Total Cards" value={data!.totalCards} />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard tint="amber" icon={<AppstoreOutlined />} label="Programs" value={data!.programs} />
            </Col>
          </>
        )}
      </Row>

      {/* Charts row */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} xl={16}>
          <SectionCard title="Balance trend" subtitle="Settlement balance over recent activity.">
            {loading ? (
              <ChartSkeleton height={260} />
            ) : trend.length > 1 ? (
              <TrendAreaChart data={trend} height={260} />
            ) : (
              <div style={{ padding: 60 }}>
                <Empty description="Not enough activity to chart yet." />
              </div>
            )}
          </SectionCard>
        </Col>
        <Col xs={24} xl={8}>
          <SectionCard title="Cards by status">
            {loading ? (
              <div style={{ padding: 20 }}>
                <CardVisualSkeleton width="100%" />
              </div>
            ) : donut.length ? (
              <>
                <DonutChart data={donut} centerValue={cards!.length} centerLabel="Cards" />
                <div style={{ marginTop: 12 }}>
                  <ChartLegend data={donut} />
                </div>
              </>
            ) : (
              <div style={{ padding: 40 }}>
                <Empty description="No cards yet." />
              </div>
            )}
          </SectionCard>
        </Col>
      </Row>

      {/* Activity + cards preview */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} xl={16}>
          <SectionCard
            title="Recent activity"
            subtitle="Latest movements on your settlement balance."
            noPadding
            extra={
              <Link to="/billing" style={{ color: BRAND.primary, fontWeight: 500 }}>
                View all <ArrowRightOutlined style={{ fontSize: 11 }} />
              </Link>
            }
          >
            {loading ? (
              <div style={{ padding: 24 }}>
                <TableSkeleton rows={5} cols={4} />
              </div>
            ) : data!.recentLedger?.length ? (
              <LedgerTable data={data!.recentLedger} pagination={false} />
            ) : (
              <div style={{ padding: 40 }}>
                <Empty description="No recent activity yet." />
              </div>
            )}
          </SectionCard>
        </Col>
        <Col xs={24} xl={8}>
          <SectionCard
            title="Your cards"
            extra={
              <Link to="/cards" style={{ color: BRAND.primary, fontWeight: 500 }}>
                All cards <ArrowRightOutlined style={{ fontSize: 11 }} />
              </Link>
            }
          >
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rc-skel" style={{ height: 72, borderRadius: 12 }} />
                ))}
              </div>
            ) : previewCards.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {previewCards.map((c) => (
                  <Link key={c.id} to={`/cards/${c.id}`} style={{ textDecoration: "none" }}>
                    <div
                      className="rc-elevate"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        border: `1px solid ${BRAND.borderSubtle}`,
                        borderRadius: 12,
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: BRAND.primarySoft,
                          color: BRAND.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        <CreditCardOutlined />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          className="tabular"
                          style={{
                            fontWeight: 600,
                            color: BRAND.textPrimary,
                            fontSize: 13.5,
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {c.maskedPan || c.program?.name || "Card"}
                        </div>
                        <div style={{ fontSize: 12, color: BRAND.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.program?.name}
                        </div>
                      </div>
                      <div className="tabular" style={{ fontWeight: 700, color: BRAND.textPrimary, whiteSpace: "nowrap" }}>
                        {formatMoney(c.balance, c.currency)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: "center" }}>
                <Empty description="No active cards" />
                <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => navigate("/cards")}>
                  Issue a card
                </Button>
              </div>
            )}
          </SectionCard>
        </Col>
      </Row>
    </div>
  );
};
