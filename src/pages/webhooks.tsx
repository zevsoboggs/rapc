import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
  Popconfirm,
  Tooltip,
  Drawer,
  Empty,
  Divider,
  Tag,
  Switch,
  App as AntdApp,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ApiOutlined,
  WarningOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { api } from "../providers/axios";
import type {
  WebhookEndpoint,
  WebhookDelivery,
  WebhookEventDef,
} from "../types";
import { formatDate } from "../utils/format";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import { BRAND } from "../theme";

const { Text, Paragraph } = Typography;

const truncate = (value: string, max = 44): string =>
  value.length > max ? `${value.slice(0, max)}…` : value;

export const WebhooksPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEventDef[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<{
    url: string;
    events: string[];
    description?: string;
  }>();

  const [createdSecret, setCreatedSecret] = useState<WebhookEndpoint | null>(
    null,
  );

  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [deliveriesFor, setDeliveriesFor] = useState<WebhookEndpoint | null>(
    null,
  );
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<WebhookEndpoint[]>("/portal/webhooks")
      .then((res) => setEndpoints(res.data ?? []))
      .catch(() => message.error("Failed to load webhooks."))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => {
    load();
    api
      .get<WebhookEventDef[]>("/portal/webhook-events")
      .then((res) => setEvents(res.data ?? []))
      .catch(() => {
        /* non-blocking */
      });
  }, [load]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied to clipboard.`);
    } catch {
      message.error(`Could not copy ${label}.`);
    }
  };

  const doCreate = async (values: {
    url: string;
    events: string[];
    description?: string;
  }) => {
    setCreating(true);
    try {
      const { data } = await api.post<WebhookEndpoint>("/portal/webhooks", {
        url: values.url,
        events: values.events,
        description: values.description,
      });
      setCreateOpen(false);
      form.resetFields();
      setCreatedSecret(data);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create webhook.";
      message.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const doTest = async (record: WebhookEndpoint) => {
    setTestingId(record.id);
    try {
      const { data } = await api.post<{
        success: boolean;
        statusCode?: number;
        error?: string;
      }>(`/portal/webhooks/${record.id}/test`);
      if (data.success) {
        message.success(
          `Test delivery succeeded${
            data.statusCode ? ` (HTTP ${data.statusCode})` : ""
          }.`,
        );
      } else {
        message.error(
          `Test delivery failed${
            data.statusCode ? ` (HTTP ${data.statusCode})` : ""
          }${data.error ? `: ${data.error}` : "."}`,
        );
      }
      load();
    } catch {
      message.error("Failed to send test delivery.");
    } finally {
      setTestingId(null);
    }
  };

  const toggleActive = async (record: WebhookEndpoint) => {
    setTogglingId(record.id);
    try {
      await api.patch(`/portal/webhooks/${record.id}`, {
        isActive: !record.isActive,
      });
      message.success(
        record.isActive ? "Endpoint disabled." : "Endpoint enabled.",
      );
      load();
    } catch {
      message.error("Failed to update endpoint.");
    } finally {
      setTogglingId(null);
    }
  };

  const doDelete = async (id: string) => {
    try {
      await api.delete(`/portal/webhooks/${id}`);
      message.success("Endpoint deleted.");
      load();
    } catch {
      message.error("Failed to delete endpoint.");
    }
  };

  const openDeliveries = (record: WebhookEndpoint) => {
    setDeliveriesFor(record);
    setDeliveries([]);
    setDeliveriesLoading(true);
    api
      .get<WebhookDelivery[]>(`/portal/webhooks/${record.id}/deliveries`)
      .then((res) => setDeliveries(res.data ?? []))
      .catch(() => message.error("Failed to load deliveries."))
      .finally(() => setDeliveriesLoading(false));
  };

  const eventLabel = (value: string): string =>
    events.find((e) => e.value === value)?.label ?? value;

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Receive real-time events at your own endpoint."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Add endpoint
          </Button>
        }
      />

      <SectionCard title="Endpoints" noPadding>
        {loading ? (
          <div style={{ padding: 24 }}>
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : endpoints.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty description="No webhook endpoints yet." />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ marginTop: 12 }}
              onClick={() => setCreateOpen(true)}
            >
              Add endpoint
            </Button>
          </div>
        ) : (
          <Table<WebhookEndpoint>
            rowKey="id"
            dataSource={endpoints}
            scroll={{ x: true }}
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: "4px 8px" }}>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: BRAND.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Signing secret
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      marginTop: 6,
                      maxWidth: 520,
                    }}
                  >
                    <Input
                      readOnly
                      value={record.secret}
                      style={{ fontFamily: "monospace" }}
                    />
                    <Tooltip title="Copy secret">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => copy(record.secret, "Signing secret")}
                      />
                    </Tooltip>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, color: BRAND.textMuted }}>
                    Subscribed events:{" "}
                    {record.events.length === 0
                      ? "—"
                      : record.events
                          .map((e) => eventLabel(e))
                          .join(", ")}
                  </div>
                </div>
              ),
            }}
            columns={[
              {
                title: "URL",
                dataIndex: "url",
                render: (v: string) => (
                  <Tooltip title={v}>
                    <Text style={{ fontFamily: "monospace" }}>{truncate(v)}</Text>
                  </Tooltip>
                ),
              },
              {
                title: "Events",
                dataIndex: "events",
                render: (evs: string[]) =>
                  evs.length <= 2 ? (
                    <Space size={4} wrap>
                      {evs.map((e) => (
                        <Tag key={e} style={{ marginInlineEnd: 0 }}>
                          {eventLabel(e)}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Tag>{evs.length} events</Tag>
                  ),
              },
              {
                title: "Status",
                dataIndex: "isActive",
                render: (active: boolean) =>
                  active ? (
                    <StatusPill status="Active" color="success" />
                  ) : (
                    <StatusPill status="Disabled" color="neutral" />
                  ),
              },
              {
                title: "Last delivery",
                dataIndex: "lastDeliveryAt",
                render: (v?: string | null) => (v ? formatDate(v) : "Never"),
              },
              {
                title: "Actions",
                key: "actions",
                fixed: "right",
                render: (_: unknown, record) => (
                  <Space size={4} wrap>
                    <Button
                      size="small"
                      icon={<SendOutlined />}
                      loading={testingId === record.id}
                      onClick={() => doTest(record)}
                    >
                      Test
                    </Button>
                    <Button size="small" onClick={() => openDeliveries(record)}>
                      Deliveries
                    </Button>
                    <Tooltip title={record.isActive ? "Disable" : "Enable"}>
                      <Switch
                        size="small"
                        checked={record.isActive}
                        loading={togglingId === record.id}
                        onChange={() => toggleActive(record)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Delete this endpoint?"
                      description="You will stop receiving events at this URL."
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => doDelete(record.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {/* Info panel */}
      <div style={{ marginTop: 20 }}>
        <SectionCard title="Delivery format">
          <Paragraph style={{ color: BRAND.textSecondary, marginBottom: 12 }}>
            Every event is delivered as an HTTP <Text code>POST</Text> to your
            endpoint with the following headers:
          </Paragraph>
          <ul style={{ margin: "0 0 12px 18px", color: BRAND.textSecondary, lineHeight: 1.9 }}>
            <li>
              <Text code>X-RapidCard-Event</Text> — the event type
            </li>
            <li>
              <Text code>X-RapidCard-Signature</Text> —{" "}
              <Text code>sha256=&lt;hex&gt;</Text> HMAC-SHA256 of the raw request
              body signed with your endpoint&apos;s signing secret
            </li>
            <li>
              <Text code>X-RapidCard-Delivery</Text> — a unique delivery id
            </li>
          </ul>
          <Paragraph style={{ color: BRAND.textSecondary, marginBottom: 6 }}>
            The JSON payload shape:
          </Paragraph>
          <pre
            style={{
              margin: 0,
              padding: "14px 16px",
              background: BRAND.primarySoft,
              border: `1px solid ${BRAND.primarySoft2}`,
              borderRadius: 12,
              fontFamily: "monospace",
              fontSize: 13,
              color: BRAND.textPrimary,
              overflowX: "auto",
            }}
          >{`{
  "id": "evt_…",
  "event": "card.created",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "data": { … }
}`}</pre>
        </SectionCard>
      </div>

      {/* Add endpoint modal */}
      <Modal
        title="Add webhook endpoint"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="Add endpoint"
        confirmLoading={creating}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={doCreate}>
          <Form.Item
            label="Endpoint URL"
            name="url"
            rules={[
              { required: true, message: "Please enter a URL" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
            extra="Events will be delivered to this HTTPS URL."
          >
            <Input placeholder="https://example.com/webhooks/rapidcard" />
          </Form.Item>
          <Form.Item
            label="Events"
            name="events"
            rules={[
              {
                required: true,
                message: "Select at least one event",
                type: "array",
                min: 1,
              },
            ]}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                {events.map((e) => (
                  <Checkbox key={e.value} value={e.value}>
                    {e.label}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input placeholder="Optional label to identify this endpoint" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Secret reveal modal */}
      <Modal
        title="Endpoint created"
        open={!!createdSecret}
        onCancel={() => setCreatedSecret(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setCreatedSecret(null)}
          >
            I have saved it
          </Button>,
        ]}
        closable
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            background: BRAND.warningSoft,
            border: "1px solid #FDE68A",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 18,
          }}
        >
          <WarningOutlined
            style={{ color: BRAND.warning, fontSize: 18, marginTop: 2 }}
          />
          <div>
            <div style={{ fontWeight: 600, color: "#92400E" }}>
              Store your signing secret
            </div>
            <div style={{ fontSize: 13, color: "#92400E", marginTop: 2 }}>
              Use it to verify each delivery. It remains available on this page,
              but keep it secret.
            </div>
          </div>
        </div>
        {createdSecret && (
          <>
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: BRAND.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Signing secret
            </Text>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <Input
                readOnly
                value={createdSecret.secret}
                style={{ fontFamily: "monospace" }}
              />
              <Tooltip title="Copy">
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={() => copy(createdSecret.secret, "Signing secret")}
                />
              </Tooltip>
            </div>
            <Divider style={{ margin: "16px 0" }} />
            <div style={{ fontSize: 13, color: BRAND.textSecondary, lineHeight: 1.6 }}>
              Verify each delivery: header{" "}
              <Text code>X-RapidCard-Signature: sha256=&lt;hex&gt;</Text> = HMAC-SHA256
              of the raw request body using this secret.
            </div>
          </>
        )}
      </Modal>

      {/* Deliveries drawer */}
      <Drawer
        title={
          <Space>
            <ApiOutlined />
            <span>Recent deliveries</span>
          </Space>
        }
        width={620}
        open={!!deliveriesFor}
        onClose={() => setDeliveriesFor(null)}
      >
        {deliveriesFor && (
          <div
            style={{
              marginBottom: 16,
              fontFamily: "monospace",
              fontSize: 13,
              color: BRAND.textSecondary,
              wordBreak: "break-all",
            }}
          >
            {deliveriesFor.url}
          </div>
        )}
        {deliveriesLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : deliveries.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Empty description="No deliveries yet." />
          </div>
        ) : (
          <Table<WebhookDelivery>
            rowKey="id"
            dataSource={deliveries}
            size="small"
            pagination={false}
            scroll={{ x: true }}
            expandable={{
              rowExpandable: (r) => !!r.error,
              expandedRowRender: (r) =>
                r.error ? (
                  <Text type="danger" style={{ fontSize: 12.5 }}>
                    {r.error}
                  </Text>
                ) : null,
            }}
            columns={[
              {
                title: "Event",
                dataIndex: "event",
                render: (v: string) => (
                  <Text style={{ fontFamily: "monospace", fontSize: 12.5 }}>
                    {eventLabel(v)}
                  </Text>
                ),
              },
              {
                title: "Result",
                dataIndex: "success",
                render: (ok: boolean) =>
                  ok ? (
                    <StatusPill status="Success" color="success" />
                  ) : (
                    <StatusPill status="Failed" color="error" />
                  ),
              },
              {
                title: "HTTP",
                dataIndex: "statusCode",
                align: "center",
                render: (v?: number | null) => v ?? "—",
              },
              {
                title: "Attempts",
                dataIndex: "attempts",
                align: "center",
              },
              {
                title: "Time",
                dataIndex: "createdAt",
                render: (v: string) => formatDate(v),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
};
