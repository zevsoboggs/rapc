import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Typography,
  Space,
  Select,
  Segmented,
  Drawer,
  Form,
  InputNumber,
  Input,
  DatePicker,
  Alert,
  Row,
  Col,
  Empty,
  Divider,
  App as AntdApp,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { api } from "../../providers/axios";
import type {
  Card,
  ListResult,
  Program,
  FundingNetwork,
  ShippingAddress,
} from "../../types";
import { formatMoney, formatDay, formatDate } from "../../utils/format";
import { CardStatusTag } from "../../components/CardStatusTag";
import { CardTypeTag } from "../../components/CardTypeTag";
import { PageHeader } from "../../components/PageHeader";
import { SectionCard } from "../../components/SectionCard";
import { MoneyText } from "../../components/MoneyText";
import { CardVisual } from "../../components/CardVisual";
import { CardVisualSkeleton, TableSkeleton } from "../../components/Skeletons";
import { BRAND } from "../../theme";

const { Text } = Typography;

const NETWORK_OPTIONS: { label: string; value: FundingNetwork }[] = [
  { label: "TRC-20 (TRON)", value: "trc20" },
  { label: "BEP-20 (BNB Chain)", value: "bep20" },
  { label: "ERC-20 (Ethereum)", value: "erc20" },
];

interface IssueFormValues {
  programId: string;
  amount: number;
  expDate?: Dayjs;
  network?: FundingNetwork;
  holderEmail?: string;
  holderPhone?: string;
  label?: string;
  shipping?: ShippingAddress;
}

export const CardsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [view, setView] = useState<"grid" | "table">(
    () => (localStorage.getItem("rc-cards-view") as "grid" | "table") || "table",
  );

  const [programs, setPrograms] = useState<Program[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<IssueFormValues>();
  const selectedProgramId = Form.useWatch("programId", form);
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const isPhysical = selectedProgram?.cardType === "PHYSICAL";

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ListResult<Card>>("/portal/cards", {
        params: { status, limit: pageSize, offset: (page - 1) * pageSize },
      })
      .then((res) => {
        setItems(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(() => message.error("Failed to load cards."))
      .finally(() => setLoading(false));
  }, [status, page, pageSize, message]);

  useEffect(() => {
    load();
  }, [load]);

  // Load programs up-front (used by the grid + deep-link preselect).
  useEffect(() => {
    api
      .get<Program[]>("/portal/programs")
      .then((res) => setPrograms(res.data ?? []))
      .catch(() => undefined);
  }, []);

  const openDrawer = useCallback(
    (programId?: string) => {
      setDrawerOpen(true);
      if (programId) form.setFieldsValue({ programId } as IssueFormValues);
    },
    [form],
  );

  // Deep links: /cards?issue=<programId> or /cards?new=1 open the issue drawer.
  useEffect(() => {
    const issue = searchParams.get("issue");
    const isNew = searchParams.get("new");
    if (issue || isNew) {
      openDrawer(issue ?? undefined);
      searchParams.delete("issue");
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitIssue = async (values: IssueFormValues) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        programId: values.programId,
        amount: String(values.amount),
      };
      if (values.expDate) payload.expDate = values.expDate.format("YYYY-MM-DD");
      if (values.network) payload.network = values.network;
      if (values.holderEmail) payload.holderEmail = values.holderEmail;
      if (values.holderPhone) payload.holderPhone = values.holderPhone;
      if (values.label) payload.label = values.label;
      if (isPhysical && values.shipping) payload.shipping = values.shipping;

      const { data } = await api.post<Card>("/portal/cards", payload);
      message.success("Card issued successfully.");
      setDrawerOpen(false);
      form.resetFields();
      load();
      if (data?.id) navigate(`/cards/${data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to issue card.";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const gridView = loading ? (
    <Row gutter={[20, 20]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Col xs={24} sm={12} xl={8} key={i}>
          <CardVisualSkeleton width="100%" />
        </Col>
      ))}
    </Row>
  ) : items.length === 0 ? (
    <SectionCard>
      <div style={{ padding: 40, textAlign: "center" }}>
        <Empty description="No cards yet." />
        <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => openDrawer()}>
          Issue your first card
        </Button>
      </div>
    </SectionCard>
  ) : (
    <Row gutter={[20, 20]}>
      {items.map((c) => (
        <Col xs={24} sm={12} xl={8} key={c.id}>
          <div
            className="rc-elevate"
            style={{ background: "#fff", border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 16, padding: 16, cursor: "pointer" }}
            onClick={() => navigate(`/cards/${c.id}`)}
          >
            <CardVisual card={c} width="100%" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: BRAND.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.label || c.program?.name || "Card"}
                </div>
                <CardStatusTag status={c.status} />
              </div>
              <MoneyText value={c.balance} currency={c.currency} strong style={{ fontSize: 18 }} />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );

  const tableView = (
    <SectionCard noPadding>
      {loading ? (
        <div style={{ padding: 24 }}>
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : (
        <Table<Card>
          rowKey="id"
          dataSource={items}
          scroll={{ x: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          columns={[
            {
              title: "Card",
              dataIndex: "maskedPan",
              render: (value: string, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong className="tabular" style={{ fontFamily: "monospace", letterSpacing: "0.02em" }}>{value}</Text>
                  {record.label && <Text type="secondary" style={{ fontSize: 12 }}>{record.label}</Text>}
                </Space>
              ),
            },
            { title: "Program", dataIndex: ["program", "name"], render: (_: unknown, record) => record.program?.name ?? "—" },
            { title: "Type", dataIndex: "cardType", render: (value: string) => <CardTypeTag cardType={value} /> },
            { title: "Status", dataIndex: "status", render: (value: string) => <CardStatusTag status={value} /> },
            { title: "Balance", dataIndex: "balance", align: "right", render: (value: string, record) => <MoneyText value={value} currency={record.currency} strong /> },
            { title: "Expiry", dataIndex: "expDate", render: (value?: string | null) => formatDay(value) },
            { title: "Created", dataIndex: "createdAt", render: (value: string) => formatDate(value) },
            {
              title: "",
              key: "actions",
              fixed: "right",
              render: (_: unknown, record) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/cards/${record.id}`)}>Details</Button>
              ),
            },
          ]}
        />
      )}
    </SectionCard>
  );

  return (
    <div>
      <PageHeader
        title="Cards"
        subtitle="Issue and manage your virtual and physical cards."
        extra={
          <>
            <Segmented
              value={view}
              onChange={(v) => {
                setView(v as "grid" | "table");
                localStorage.setItem("rc-cards-view", v as string);
              }}
              options={[
                { value: "table", icon: <UnorderedListOutlined /> },
                { value: "grid", icon: <AppstoreOutlined /> },
              ]}
            />
            <Select
              allowClear
              placeholder="Filter by status"
              style={{ width: 170 }}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Frozen", value: "FROZEN" },
                { label: "Released", value: "RELEASED" },
                { label: "Failed", value: "FAILED" },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>Issue card</Button>
          </>
        }
      />

      {view === "grid" ? gridView : tableView}

      <Drawer
        title="Issue a new card"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={isPhysical && selectedProgram?.inStock === false}
              onClick={() => form.submit()}
            >
              Issue card
            </Button>
          </Space>
        }
      >
        {/* Live card preview */}
        {selectedProgram && (
          <div style={{ marginBottom: 20 }}>
            <CardVisual
              program={selectedProgram}
              width="100%"
              face={{
                artworkSvg: selectedProgram.artworkSvg,
                cardColor: selectedProgram.cardColor,
                last4: "0000",
                holder: form.getFieldValue("holderEmail") || "RAPIDCARD USER",
                network: selectedProgram.network,
                cardType: selectedProgram.cardType,
              }}
            />
          </div>
        )}

        <Form<IssueFormValues> form={form} layout="vertical" onFinish={submitIssue} requiredMark>
          <Form.Item label="Program" name="programId" rules={[{ required: true, message: "Please select a program" }]}>
            <Select
              placeholder="Select a card program"
              options={programs.map((p) => ({ label: `${p.name} · ${p.cardType === "PHYSICAL" ? "Physical" : "Virtual"}`, value: p.id }))}
            />
          </Form.Item>

          {isPhysical && selectedProgram?.inStock === false && (
            <Alert
              style={{ marginBottom: 16 }}
              type="warning"
              showIcon
              message="Out of stock"
              description="This physical card program has no cards in stock right now. Please try again later."
            />
          )}

          {selectedProgram && (
            <Alert
              style={{ marginBottom: 16 }}
              type="info"
              showIcon
              message={selectedProgram.name}
              description={
                <Space direction="vertical" size={2}>
                  <span>Issuance fee: {formatMoney(selectedProgram.issuanceFee, selectedProgram.currency)}</span>
                  {isPhysical && <span>Shipping fee: {formatMoney(selectedProgram.shippingFee, selectedProgram.currency)}</span>}
                  {isPhysical && (
                    <span>
                      Availability:{" "}
                      {selectedProgram.inStock
                        ? `${selectedProgram.physicalStock ?? 0} in stock`
                        : "Out of stock"}
                    </span>
                  )}
                  <span>Top-up fee: {selectedProgram.topupFeePercent ?? "0"}% · Withdraw fee: {selectedProgram.withdrawFeePercent ?? "0"}%</span>
                  <span>Top-up limits: {formatMoney(selectedProgram.minTopup, selectedProgram.currency)} – {formatMoney(selectedProgram.maxTopup, selectedProgram.currency)}</span>
                  {selectedProgram.minInitialLoad != null && (
                    <span>Minimum initial load: {formatMoney(selectedProgram.minInitialLoad, selectedProgram.currency)}</span>
                  )}
                </Space>
              }
            />
          )}

          <Form.Item
            label="Initial load amount"
            name="amount"
            extra={
              selectedProgram?.minInitialLoad != null
                ? `Minimum initial load: ${formatMoney(selectedProgram.minInitialLoad, selectedProgram.currency)}`
                : selectedProgram?.minTopup != null
                  ? `Minimum: ${formatMoney(selectedProgram.minTopup, selectedProgram.currency)}`
                  : undefined
            }
            rules={[{ required: true, message: "Please enter an amount" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} step={10} prefix="$" placeholder="0.00" />
          </Form.Item>

          <Form.Item label="Expiry date" name="expDate" extra="Optional. Leave empty to use the program default.">
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item label="Funding network" name="network" extra="Optional. Crypto network used to fund the initial load.">
            <Select allowClear placeholder="Select network" options={NETWORK_OPTIONS} />
          </Form.Item>

          <Form.Item label="Holder email" name="holderEmail" rules={[{ type: "email", message: "Enter a valid email" }]}>
            <Input placeholder="holder@company.com" />
          </Form.Item>

          <Form.Item label="Holder phone" name="holderPhone">
            <Input placeholder="+48123456789" />
          </Form.Item>

          <Form.Item label="Label" name="label">
            <Input placeholder="e.g. Marketing team card" />
          </Form.Item>

          {isPhysical && (
            <>
              <Divider orientation="left" style={{ color: BRAND.textSecondary, fontSize: 13 }}>Shipping details</Divider>
              <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Shipping details required" description="This is a physical card. Please provide a delivery address." />
              <Form.Item label="Recipient name" name={["shipping", "recipientName"]} rules={[{ required: true, message: "Recipient name is required" }]}>
                <Input placeholder="Jane Doe" />
              </Form.Item>
              <Form.Item label="Address line 1" name={["shipping", "line1"]} rules={[{ required: true, message: "Address line 1 is required" }]}>
                <Input placeholder="123 Main St" />
              </Form.Item>
              <Form.Item label="Address line 2" name={["shipping", "line2"]}>
                <Input placeholder="Apt, suite, etc. (optional)" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="City" name={["shipping", "city"]} rules={[{ required: true, message: "City is required" }]}>
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="State / Region" name={["shipping", "state"]}>
                    <Input placeholder="State (optional)" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Postal code" name={["shipping", "postalCode"]} rules={[{ required: true, message: "Postal code is required" }]}>
                    <Input placeholder="00-000" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Country" name={["shipping", "country"]} rules={[{ required: true, message: "Country is required" }]}>
                    <Input placeholder="Country" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Phone" name={["shipping", "phone"]} rules={[{ required: true, message: "Phone is required" }]}>
                <Input placeholder="+48123456789" />
              </Form.Item>
            </>
          )}
        </Form>
      </Drawer>
    </div>
  );
};
