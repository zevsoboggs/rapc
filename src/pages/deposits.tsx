import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Descriptions,
  Tooltip,
  Divider,
  App as AntdApp,
} from "antd";
import {
  PlusOutlined,
  CopyOutlined,
  ReloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../providers/axios";
import type { Deposit, ListResult, FundingNetwork } from "../types";
import { formatDate } from "../utils/format";
import { DepositStatusTag } from "../components/DepositStatusTag";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { MoneyText } from "../components/MoneyText";
import { BRAND } from "../theme";

const { Text } = Typography;

const NETWORK_OPTIONS: { label: string; value: FundingNetwork }[] = [
  { label: "TRC-20 (TRON)", value: "trc20" },
  { label: "BEP-20 (BNB Chain)", value: "bep20" },
  { label: "ERC-20 (Ethereum)", value: "erc20" },
];

const truncate = (value: string, head = 10, tail = 6): string =>
  value.length > head + tail + 3
    ? `${value.slice(0, head)}…${value.slice(-tail)}`
    : value;

export const DepositsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<{ amount: number; network: FundingNetwork }>();

  const [active, setActive] = useState<Deposit | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ListResult<Deposit>>("/portal/deposits", {
        params: { limit: pageSize, offset: (page - 1) * pageSize },
      })
      .then((res) => {
        setItems(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => message.error("Failed to load deposits."))
      .finally(() => setLoading(false));
  }, [page, message]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-open the instructions panel when arriving via ?new=1 (Dashboard shortcut).
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied to clipboard.`);
    } catch {
      message.error(`Could not copy ${label}.`);
    }
  };

  const doCreate = async (values: { amount: number; network: FundingNetwork }) => {
    setCreating(true);
    try {
      const { data } = await api.post<Deposit>("/portal/deposits", {
        amount: String(values.amount),
        network: values.network,
      });
      setCreateOpen(false);
      form.resetFields();
      setActive(data);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create deposit.";
      message.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const checkStatus = async () => {
    if (!active) return;
    setChecking(true);
    try {
      const { data } = await api.get<Deposit>(`/portal/deposits/${active.id}`);
      setActive(data);
      load();
      message.success(`Status: ${data.status}.`);
    } catch {
      message.error("Failed to refresh deposit status.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add funds"
        subtitle="Fund your settlement balance with USDT. Create a deposit, send the exact amount to the generated address, and your balance is credited automatically once confirmed on-chain."
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              New deposit
            </Button>
          </>
        }
      />

      <SectionCard title="Deposit history" noPadding>
        <Table<Deposit>
          rowKey="id"
          dataSource={items}
          loading={loading}
          scroll={{ x: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
          }}
          columns={[
            {
              title: "Date",
              dataIndex: "createdAt",
              render: (v: string) => formatDate(v),
              width: 180,
            },
            {
              title: "Amount",
              dataIndex: "amount",
              align: "right",
              render: (v: string, r) => (
                <MoneyText value={v} currency={r.currency} strong />
              ),
              width: 130,
            },
            {
              title: "Network / Asset",
              key: "network",
              render: (_: unknown, r) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{r.asset}</Text>
                  <Text type="secondary" style={{ textTransform: "uppercase" }}>
                    {r.network}
                  </Text>
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (v: string) => <DepositStatusTag status={v} />,
              width: 120,
            },
            {
              title: "Pay address",
              dataIndex: "payAddress",
              render: (v?: string | null) =>
                v ? (
                  <Space>
                    <Text style={{ fontFamily: "monospace" }}>{truncate(v)}</Text>
                    <Tooltip title="Copy address">
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => copy(v, "Pay address")}
                      />
                    </Tooltip>
                  </Space>
                ) : (
                  "—"
                ),
            },
            {
              title: "Actions",
              key: "actions",
              fixed: "right",
              render: (_: unknown, r) => (
                <Button size="small" onClick={() => setActive(r)}>
                  View
                </Button>
              ),
            },
          ]}
        />
      </SectionCard>

      {/* New deposit modal */}
      <Modal
        title="New deposit"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="Create deposit"
        confirmLoading={creating}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={doCreate}
          initialValues={{ network: "trc20" }}
        >
          <Form.Item
            label="Amount (USD)"
            name="amount"
            rules={[{ required: true, message: "Please enter an amount" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} step={10} prefix="$" />
          </Form.Item>
          <Form.Item
            label="Network"
            name="network"
            rules={[{ required: true, message: "Please select a network" }]}
          >
            <Select options={NETWORK_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment instructions modal */}
      <Modal
        title="Deposit payment instructions"
        open={!!active}
        onCancel={() => setActive(null)}
        width={560}
        footer={[
          <Button
            key="check"
            icon={<ReloadOutlined />}
            loading={checking}
            onClick={checkStatus}
          >
            Check status
          </Button>,
          <Button key="close" type="primary" onClick={() => setActive(null)}>
            Close
          </Button>,
        ]}
      >
        {active && (
          <>
            <div style={{ marginBottom: 16 }}>
              <DepositStatusTag status={active.status} />
            </div>

            {/* Amount callout */}
            <div
              style={{
                background: BRAND.gradient,
                borderRadius: 14,
                padding: "18px 20px",
                color: "#fff",
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <WalletOutlined />
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>
                  Send exactly
                </div>
                <div
                  className="tabular"
                  style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}
                >
                  {active.cryptoAmount} {active.asset}
                </div>
              </div>
            </div>

            {/* Scan-to-pay QR of the invoice address */}
            {active.payAddress && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <div
                  style={{
                    padding: 14,
                    background: "#fff",
                    border: `1px solid ${BRAND.borderSubtle}`,
                    borderRadius: 16,
                    boxShadow: "0 4px 14px rgba(16,24,40,.06)",
                    textAlign: "center",
                  }}
                >
                  <QRCodeSVG
                    value={active.payAddress}
                    size={168}
                    level="M"
                    marginSize={0}
                    fgColor="#0F172A"
                  />
                  <div style={{ marginTop: 8, fontSize: 11.5, color: BRAND.textMuted }}>
                    Scan to pay · {active.network.toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: BRAND.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Pay address · {active.network.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "stretch",
              }}
            >
              <div
                className="tabular"
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: 15,
                  wordBreak: "break-all",
                  background: BRAND.primarySoft,
                  border: `1px solid ${BRAND.primarySoft2}`,
                  color: BRAND.textPrimary,
                  borderRadius: 12,
                  padding: "14px 16px",
                  lineHeight: 1.5,
                }}
              >
                {active.payAddress}
              </div>
              <Tooltip title="Copy address">
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  style={{ height: "auto" }}
                  onClick={() => copy(active.payAddress, "Pay address")}
                />
              </Tooltip>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: BRAND.textSecondary,
                background: BRAND.warningSoft,
                border: `1px solid #FDE68A`,
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              Send the exact amount; your balance is credited automatically once
              confirmed.
            </div>

            <Divider style={{ margin: "18px 0" }} />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Amount (USD)">
                <MoneyText value={active.amount} currency={active.currency} strong />
              </Descriptions.Item>
              <Descriptions.Item label="Crypto amount">
                <Space>
                  <Text strong className="tabular">
                    {active.cryptoAmount} {active.asset}
                  </Text>
                  <Tooltip title="Copy amount">
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copy(active.cryptoAmount, "Amount")}
                    />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Network">
                <span style={{ textTransform: "uppercase" }}>{active.network}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Expires at">
                {active.expiresAt &&
                new Date(active.expiresAt).getFullYear() > 2000
                  ? formatDate(active.expiresAt)
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {formatDate(active.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
};
