import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Typography,
  Space,
  Drawer,
  Form,
  InputNumber,
  Select,
  Tooltip,
  App as AntdApp,
} from "antd";
import {
  PlusOutlined,
  CopyOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../providers/axios";
import type { Deposit, ListResult, FundingNetwork } from "../types";
import { formatDate, formatMoney } from "../utils/format";
import { DepositStatusTag } from "../components/DepositStatusTag";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { MoneyText } from "../components/MoneyText";
import { BRAND } from "../theme";

const { Text } = Typography;

const NETWORK_OPTIONS: { label: string; value: FundingNetwork; chain: string }[] = [
  { label: "Tron", value: "trc20", chain: "TRC-20" },
  { label: "BNB Chain", value: "bep20", chain: "BEP-20" },
  { label: "Ethereum", value: "erc20", chain: "ERC-20" },
];

const truncate = (v: string, head = 10, tail = 6): string =>
  v.length > head + tail + 3 ? `${v.slice(0, head)}…${v.slice(-tail)}` : v;

// Small round token/chain glyph.
const Coin: React.FC<{ bg: string; label: string; size?: number }> = ({ bg, label, size = 26 }) => (
  <span style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.5, flexShrink: 0 }}>
    {label}
  </span>
);

const NET_BG: Record<string, string> = { trc20: "#EB0029", bep20: "#F0B90B", erc20: "#627EEA" };

export const DepositsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [active, setActive] = useState<Deposit | null>(null);
  const [form] = Form.useForm<{ amount: number; network: FundingNetwork; coin: string }>();

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ListResult<Deposit>>("/portal/deposits", { params: { limit: pageSize, offset: (page - 1) * pageSize } })
      .then((res) => {
        setItems(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => message.error("Failed to load deposits."))
      .finally(() => setLoading(false));
  }, [page, message]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setActive(null);
      setOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied`);
    } catch {
      message.error(`Could not copy ${label}`);
    }
  };

  const openNew = () => { setActive(null); form.resetFields(); setOpen(true); };
  const closeDrawer = () => { setOpen(false); setActive(null); };

  const doCreate = async (values: { amount: number; network: FundingNetwork }) => {
    setCreating(true);
    try {
      const { data } = await api.post<Deposit>("/portal/deposits", {
        amount: String(values.amount),
        network: values.network,
      });
      setActive(data);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create deposit.";
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

  const activeNet = active ? NETWORK_OPTIONS.find((n) => n.value === active.network) : undefined;
  const rate = active && parseFloat(active.cryptoAmount) > 0
    ? (parseFloat(active.amount) / parseFloat(active.cryptoAmount)).toFixed(2)
    : "1.00";

  return (
    <div>
      <PageHeader
        title="Add funds"
        subtitle="Fund your balance with USDT. Send the exact amount to the generated address and your balance is credited automatically once confirmed on-chain."
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>New deposit</Button>
          </>
        }
      />

      <SectionCard title="Deposit history" noPadding>
        <Table<Deposit>
          rowKey="id"
          dataSource={items}
          loading={loading}
          scroll={{ x: true }}
          pagination={{ current: page, pageSize, total, onChange: (p) => setPage(p) }}
          columns={[
            { title: "Date", dataIndex: "createdAt", render: (v: string) => formatDate(v), width: 180 },
            { title: "Amount", dataIndex: "amount", align: "right", render: (v: string, r) => <MoneyText value={v} currency={r.currency} strong />, width: 130 },
            {
              title: "Network / Asset", key: "network",
              render: (_: unknown, r) => (
                <Space><Coin bg={NET_BG[r.network] || "#94A3B8"} label={r.asset?.[0] || "$"} size={22} />
                  <Space direction="vertical" size={0}><Text strong>{r.asset}</Text><Text type="secondary" style={{ textTransform: "uppercase" }}>{r.network}</Text></Space>
                </Space>
              ),
            },
            { title: "Status", dataIndex: "status", render: (v: string) => <DepositStatusTag status={v} />, width: 120 },
            {
              title: "Pay address", dataIndex: "payAddress",
              render: (v?: string | null) => v ? (
                <Space><Text style={{ fontFamily: "monospace" }}>{truncate(v)}</Text>
                  <Tooltip title="Copy address"><Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(v, "Pay address")} /></Tooltip></Space>
              ) : "—",
            },
            { title: "", key: "actions", fixed: "right", render: (_: unknown, r) => <Button size="small" onClick={() => { setActive(r); setOpen(true); }}>View</Button> },
          ]}
        />
      </SectionCard>

      {/* ── Add funds drawer ─────────────────────────────────── */}
      <Drawer
        title="Add funds"
        placement="right"
        width={480}
        open={open}
        onClose={closeDrawer}
        closeIcon={<CloseOutlined />}
      >
        {!active ? (
          // Form state
          <Form form={form} layout="vertical" onFinish={doCreate} initialValues={{ network: "trc20", coin: "USDT", amount: 100 }}>
            <div style={{ fontWeight: 600, color: BRAND.textPrimary, marginBottom: 8 }}>Select a coin to deposit</div>
            <Form.Item name="coin">
              <Select size="large" options={[{ value: "USDT", label: (<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Coin bg="#26A17B" label="₮" /> USDT</span>) }]} />
            </Form.Item>

            <div style={{ fontWeight: 600, color: BRAND.textPrimary, margin: "10px 0 8px" }}>Network</div>
            <Form.Item name="network" rules={[{ required: true, message: "Select a network" }]}>
              <Select
                size="large"
                options={NETWORK_OPTIONS.map((n) => ({
                  value: n.value,
                  label: (<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Coin bg={NET_BG[n.value]} label={n.label[0]} /> {n.label} · {n.chain}</span>),
                }))}
              />
            </Form.Item>

            <div style={{ fontWeight: 600, color: BRAND.textPrimary, margin: "10px 0 8px" }}>Amount (USD)</div>
            <Form.Item name="amount" rules={[{ required: true, message: "Enter an amount" }]}>
              <InputNumber size="large" style={{ width: "100%" }} min={1} step={10} prefix="$" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={creating} style={{ height: 48, borderRadius: 12, marginTop: 8 }}>
              Continue
            </Button>
          </Form>
        ) : (
          // Invoice state
          <div>
            <div style={{ fontWeight: 600, color: BRAND.textPrimary, marginBottom: 8 }}>Coin</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <Coin bg="#26A17B" label="₮" /> <span style={{ fontWeight: 500 }}>{active.asset}</span>
            </div>

            <div style={{ fontWeight: 600, color: BRAND.textPrimary, marginBottom: 8 }}>Network</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <Coin bg={NET_BG[active.network] || "#94A3B8"} label={(activeNet?.label || active.network)[0].toUpperCase()} />
              <span style={{ fontWeight: 500 }}>{activeNet?.label || active.network.toUpperCase()}</span>
              <span style={{ marginLeft: "auto" }}><DepositStatusTag status={active.status} /></span>
            </div>

            <div style={{ fontWeight: 700, color: BRAND.textPrimary, marginBottom: 4 }}>Confirm your deposit details.</div>
            <p style={{ color: BRAND.textSecondary, fontSize: 13.5, lineHeight: 1.5, marginTop: 0 }}>
              Send only {active.asset} {activeNet?.label || active.network} to this address. Sending assets on other
              networks or NFTs will result in irreversible loss of funds.
            </p>

            {active.payAddress && (
              <div style={{ display: "flex", justifyContent: "center", margin: "18px 0" }}>
                <div style={{ padding: 14, background: "#fff", border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 16, boxShadow: "0 4px 14px rgba(16,24,40,.06)" }}>
                  <QRCodeSVG value={active.payAddress} size={176} level="M" marginSize={0} fgColor="#0F172A" />
                </div>
              </div>
            )}

            <div style={{ background: BRAND.primarySoft, color: BRAND.primary, borderRadius: 12, padding: "12px 16px", fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>
              Send exactly <b>{active.cryptoAmount} {active.asset}</b>. Network fee for transfers is 0%.
            </div>

            <div style={{ background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: 18 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 6 }}>{active.asset} address</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="tabular" style={{ flex: 1, fontFamily: "monospace", fontSize: 14, color: BRAND.textPrimary, wordBreak: "break-all", lineHeight: 1.5 }}>{active.payAddress}</span>
                  <Tooltip title="Copy address"><Button type="text" shape="circle" icon={<CopyOutlined style={{ color: BRAND.textMuted }} />} onClick={() => copy(active.payAddress, "Address")} /></Tooltip>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Exchange rate</div>
                <div className="tabular" style={{ fontSize: 15, fontWeight: 600, color: BRAND.textPrimary }}>1 {active.asset} = {formatMoney(rate, active.currency)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Button block icon={<ReloadOutlined />} loading={checking} onClick={checkStatus} style={{ height: 46, borderRadius: 12 }}>Check status</Button>
              <Button block type="primary" onClick={openNew} style={{ height: 46, borderRadius: 12 }}>New deposit</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
