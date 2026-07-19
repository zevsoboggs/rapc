import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Descriptions,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Modal,
  Form,
  InputNumber,
  Input,
  Popconfirm,
  Alert,
  Tag,
  Tooltip,
  App as AntdApp,
} from "antd";
import {
  EyeOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  StopOutlined,
  MailOutlined,
  PhoneOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { api } from "../../providers/axios";
import type {
  Card,
  CardSecrets,
  CardTransaction,
  ListResult,
  MoneyMovementResult,
} from "../../types";
import { formatMoney, formatDate, formatDay } from "../../utils/format";
import { CardStatusTag } from "../../components/CardStatusTag";
import { CardTypeTag } from "../../components/CardTypeTag";
import { StatusPill } from "../../components/StatusPill";
import { PageHeader } from "../../components/PageHeader";
import { SectionCard } from "../../components/SectionCard";
import { MoneyText } from "../../components/MoneyText";
import { CardVisual } from "../../components/CardVisual";
import { CardVisualSkeleton, TableSkeleton } from "../../components/Skeletons";

const { Text, Paragraph } = Typography;

const copy = async (value: string, label: string, onOk: (msg: string) => void) => {
  try {
    await navigator.clipboard.writeText(value);
    onOk(`${label} copied to clipboard.`);
  } catch {
    onOk(`Could not copy ${label}.`);
  }
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
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnPage, setTxnPage] = useState(1);
  const txnPageSize = 20;

  const [topupOpen, setTopupOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
      .get<ListResult<CardTransaction>>(`/portal/cards/${id}/transactions`, {
        params: { limit: txnPageSize, offset: (txnPage - 1) * txnPageSize },
      })
      .then((res) => {
        setTxns(res.data.items ?? []);
        setTxnTotal(res.data.total ?? 0);
      })
      .catch(() => message.error("Failed to load transactions."))
      .finally(() => setTxnLoading(false));
  }, [id, txnPage, message]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  useEffect(() => {
    loadTxns();
  }, [loadTxns]);

  const reveal = async () => {
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
  };

  const doTopup = async (values: { amount: number }) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const { data } = await api.post<MoneyMovementResult>(
        `/portal/cards/${id}/topup`,
        { amount: String(values.amount) },
      );
      message.success(
        `Top-up submitted. Amount ${formatMoney(data.amount)}, fee ${formatMoney(
          data.fee,
        )}.`,
      );
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
      const { data } = await api.post<MoneyMovementResult>(
        `/portal/cards/${id}/withdraw`,
        { amount: String(values.amount) },
      );
      message.success(
        `Withdrawal submitted. Amount ${formatMoney(data.amount)}, fee ${formatMoney(
          data.fee,
        )}.`,
      );
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
      message.success("Card released. Remaining balance returned.");
      setSecrets(null);
      loadCard();
      loadTxns();
    } catch (err: unknown) {
      message.error(errMsg(err, "Failed to release card."));
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
      await api.post(`/portal/cards/${id}/phone`, {
        zoneNumber: values.zoneNumber,
        phoneNumber: values.phoneNumber,
      });
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

  if (loading) {
    return (
      <div>
        <PageHeader
          title={
            <Space size={12}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/cards")} />
              Card details
            </Space>
          }
        />
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <SectionCard title="Overview">
              <TableSkeleton rows={6} cols={2} />
            </SectionCard>
          </Col>
          <Col xs={24} lg={10}>
            <div style={{ marginBottom: 20 }}>
              <CardVisualSkeleton width="100%" />
            </div>
            <SectionCard title="Actions">
              <TableSkeleton rows={4} cols={1} />
            </SectionCard>
          </Col>
        </Row>
      </div>
    );
  }

  if (!card) {
    return <Alert type="error" showIcon message="Card not found." />;
  }

  const isReleased = card.status === "RELEASED";

  return (
    <div>
      <PageHeader
        title={
          <Space size={12}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/cards")}
            />
            Card details
          </Space>
        }
        subtitle={
          <span className="tabular" style={{ fontFamily: "monospace" }}>
            {card.maskedPan}
          </span>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadCard}>
            Refresh
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <SectionCard title="Overview">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Masked PAN">
                <Text className="tabular" style={{ fontFamily: "monospace" }}>
                  {card.maskedPan}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Program">
                {card.program?.name ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <CardTypeTag cardType={card.cardType} />
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <CardStatusTag status={card.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Balance">
                <MoneyText value={card.balance} currency={card.currency} strong />
              </Descriptions.Item>
              <Descriptions.Item label="Network">
                {card.network ? <Tag>{card.network}</Tag> : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry">
                {formatDay(card.expDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Holder email">
                {card.holderEmail || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Holder phone">
                {card.holderPhone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Label">{card.label || "—"}</Descriptions.Item>
              <Descriptions.Item label="Created">
                {formatDate(card.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </SectionCard>

          {card.cardType === "PHYSICAL" && (
            <div style={{ marginTop: 20 }}>
              <SectionCard title="Shipping & delivery">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Delivery status">
                    {card.deliveryStatus ? (
                      <StatusPill kind="shipment" status={card.deliveryStatus} />
                    ) : (
                      "—"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tracking number">
                    {card.trackingNumber ? (
                      <Space>
                        <Text className="tabular" style={{ fontFamily: "monospace" }}>
                          {card.trackingNumber}
                        </Text>
                        <Button
                          size="small"
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() =>
                            copy(card.trackingNumber!, "Tracking number", (m) => message.success(m))
                          }
                        />
                      </Space>
                    ) : (
                      "Not available yet"
                    )}
                  </Descriptions.Item>
                  {card.activationCode && (
                    <Descriptions.Item label="Activation code">
                      <Space>
                        <Text strong className="tabular" style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>
                          {card.activationCode}
                        </Text>
                        <Button
                          size="small"
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() =>
                            copy(card.activationCode!, "Activation code", (m) => message.success(m))
                          }
                        />
                      </Space>
                    </Descriptions.Item>
                  )}
                  {card.activationPin && (
                    <Descriptions.Item label="Activation PIN">
                      <Text strong className="tabular" style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>
                        {card.activationPin}
                      </Text>
                    </Descriptions.Item>
                  )}
                <Descriptions.Item label="Recipient">
                  {card.shipping?.recipientName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {card.shipping ? (
                    <Space direction="vertical" size={0}>
                      <span>{card.shipping.line1}</span>
                      {card.shipping.line2 && <span>{card.shipping.line2}</span>}
                      <span>
                        {[
                          card.shipping.city,
                          card.shipping.state,
                          card.shipping.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <span>{card.shipping.country}</span>
                    </Space>
                  ) : (
                    "—"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {card.shipping?.phone || "—"}
                </Descriptions.Item>
              </Descriptions>
              </SectionCard>
            </div>
          )}
        </Col>

        <Col xs={24} lg={10}>
          <div style={{ marginBottom: 20, maxWidth: 340, marginInline: "auto" }}>
            <CardVisual card={card} width="100%" />
          </div>

          <SectionCard title="Actions" style={{ marginBottom: 20 }}>
            <Space direction="vertical" style={{ width: "100%" }} size={10}>
              <Button
                block
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setTopupOpen(true)}
                disabled={isReleased}
              >
                Top up
              </Button>
              <Button
                block
                icon={<MinusCircleOutlined />}
                onClick={() => setWithdrawOpen(true)}
                disabled={isReleased}
              >
                Withdraw
              </Button>
              <Button
                block
                icon={<MailOutlined />}
                onClick={() => setEmailOpen(true)}
                disabled={isReleased}
              >
                Update email
              </Button>
              <Button
                block
                icon={<PhoneOutlined />}
                onClick={() => setPhoneOpen(true)}
                disabled={isReleased}
              >
                Update phone
              </Button>
              <Popconfirm
                title="Release this card?"
                description="The card will be permanently closed and the remaining balance returned to your account balance."
                okText="Release"
                okButtonProps={{ danger: true }}
                onConfirm={doRelease}
                disabled={isReleased}
              >
                <Button block danger icon={<StopOutlined />} disabled={isReleased}>
                  Release card
                </Button>
              </Popconfirm>
            </Space>
          </SectionCard>

          <SectionCard title="Secure card details">
            {!secrets ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  Sensitive card data is revealed on demand and never stored by this
                  portal.
                </Paragraph>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  loading={revealing}
                  onClick={reveal}
                  disabled={isReleased}
                >
                  Reveal card details
                </Button>
              </Space>
            ) : (
              <div
                style={{
                  background:
                    "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)",
                  color: "#e2e8f0",
                  borderRadius: 14,
                  padding: 20,
                  border: "1px solid rgba(148,163,184,.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#FCD34D",
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  <LockOutlined />
                  Do not store or share these details — shown once, not persisted.
                </div>
                <SecretRow
                  label="Card number"
                  value={secrets.cardNumber}
                  mono
                  onCopy={(v, l) => copy(v, l, (m) => message.success(m))}
                />
                <SecretRow
                  label="CVV"
                  value={secrets.cvv}
                  mono
                  onCopy={(v, l) => copy(v, l, (m) => message.success(m))}
                />
                <SecretRow
                  label="Expiry"
                  value={secrets.expDate}
                  mono
                  onCopy={(v, l) => copy(v, l, (m) => message.success(m))}
                />
                <Button
                  size="small"
                  style={{ marginTop: 8 }}
                  onClick={() => setSecrets(null)}
                >
                  Hide details
                </Button>
              </div>
            )}
          </SectionCard>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
      <SectionCard noPadding>
        <Tabs
          tabBarStyle={{ padding: "0 20px", marginBottom: 0 }}
          items={[
            {
              key: "transactions",
              label: "Transactions",
              children: (
                <Table<CardTransaction>
                  rowKey="id"
                  dataSource={txns}
                  loading={txnLoading}
                  scroll={{ x: true }}
                  pagination={{
                    current: txnPage,
                    pageSize: txnPageSize,
                    total: txnTotal,
                    onChange: (p) => setTxnPage(p),
                  }}
                  columns={[
                    {
                      title: "Date",
                      dataIndex: "occurredAt",
                      render: (v: string) => formatDate(v),
                      width: 180,
                    },
                    {
                      title: "Type",
                      dataIndex: "type",
                      render: (v: string) => <Tag>{v}</Tag>,
                    },
                    {
                      title: "Amount",
                      dataIndex: "amount",
                      align: "right",
                      render: (v: string, r) => (
                        <MoneyText value={v} currency={r.currency} />
                      ),
                    },
                    {
                      title: "Merchant",
                      dataIndex: "merchant",
                      render: (v?: string | null) => v || "—",
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                      render: (v: string) => (
                        <StatusPill status={v} color="neutral" />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </SectionCard>
      </div>

      {/* Top up */}
      <Modal
        title="Top up card"
        open={topupOpen}
        onCancel={() => setTopupOpen(false)}
        onOk={() => topupForm.submit()}
        okText="Top up"
        confirmLoading={actionLoading}
        destroyOnClose
      >
        <Form form={topupForm} layout="vertical" onFinish={doTopup}>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter an amount" }]}
            extra="A top-up fee may apply based on your program."
          >
            <InputNumber style={{ width: "100%" }} min={0} step={10} prefix="$" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdraw */}
      <Modal
        title="Withdraw from card"
        open={withdrawOpen}
        onCancel={() => setWithdrawOpen(false)}
        onOk={() => withdrawForm.submit()}
        okText="Withdraw"
        confirmLoading={actionLoading}
        destroyOnClose
      >
        <Form form={withdrawForm} layout="vertical" onFinish={doWithdraw}>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Please enter an amount" }]}
            extra="A withdrawal fee may apply based on your program."
          >
            <InputNumber style={{ width: "100%" }} min={0} step={10} prefix="$" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Email */}
      <Modal
        title="Update holder email"
        open={emailOpen}
        onCancel={() => setEmailOpen(false)}
        onOk={() => emailForm.submit()}
        okText="Save"
        confirmLoading={actionLoading}
        destroyOnClose
      >
        <Form
          form={emailForm}
          layout="vertical"
          onFinish={doEmail}
          initialValues={{ email: card.holderEmail ?? "" }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter an email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input placeholder="holder@company.com" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Phone */}
      <Modal
        title="Update holder phone"
        open={phoneOpen}
        onCancel={() => setPhoneOpen(false)}
        onOk={() => phoneForm.submit()}
        okText="Save"
        confirmLoading={actionLoading}
        destroyOnClose
      >
        <Form
          form={phoneForm}
          layout="vertical"
          onFinish={doPhone}
          initialValues={{ zoneNumber: "+48" }}
        >
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item
                label="Zone"
                name="zoneNumber"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="+48" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="Phone number"
                name="phoneNumber"
                rules={[{ required: true, message: "Please enter a phone number" }]}
              >
                <Input placeholder="123456789" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

const SecretRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  onCopy: (value: string, label: string) => void;
}> = ({ label, value, mono, onCopy }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    <div>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: mono ? "monospace" : undefined, fontSize: 16 }}>
        {value}
      </div>
    </div>
    <Tooltip title={`Copy ${label}`}>
      <Button
        size="small"
        ghost
        icon={<CopyOutlined />}
        onClick={() => onCopy(value, label)}
      />
    </Tooltip>
  </div>
);

function errMsg(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  );
}
