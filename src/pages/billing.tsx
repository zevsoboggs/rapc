import { useCallback, useEffect, useState } from "react";
import { Row, Col, App as AntdApp } from "antd";
import { WalletOutlined } from "@ant-design/icons";
import { api } from "../providers/axios";
import type { LedgerEntry, Me } from "../types";
import { formatMoney } from "../utils/format";
import { LedgerTable } from "../components/LedgerTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";

interface LedgerResponse {
  items: LedgerEntry[];
  total: number;
}

export const BillingPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [balance, setBalance] = useState<string>("0");
  const [currency, setCurrency] = useState<string>("USD");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<LedgerResponse>("/portal/ledger", {
        params: { limit: pageSize, offset: (page - 1) * pageSize },
      })
      .then((res) => {
        setEntries(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => message.error("Failed to load ledger."))
      .finally(() => setLoading(false));
  }, [page, message]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get<Me>("/portal/me")
      .then((res) => {
        if (res.data.balance != null) setBalance(res.data.balance);
        if (res.data.currency) setCurrency(res.data.currency);
      })
      .catch(() => {
        /* balance is best-effort */
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Your settlement balance and full ledger history."
      />

      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={14} md={10} lg={8}>
          <StatCard
            highlight
            tint="blue"
            icon={<WalletOutlined />}
            label="Current Balance"
            value={formatMoney(balance, currency)}
          />
        </Col>
      </Row>

      <SectionCard title="Ledger" subtitle="All balance movements." noPadding>
        <LedgerTable
          data={entries}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p: number) => setPage(p),
          }}
        />
      </SectionCard>
    </div>
  );
};
