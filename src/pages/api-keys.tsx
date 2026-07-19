import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  Tooltip,
  Divider,
  App as AntdApp,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  KeyOutlined,
  ApiOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { api, API_URL } from "../providers/axios";
import type { ApiKey, CreatedApiKey } from "../types";
import { formatDate } from "../utils/format";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { BRAND } from "../theme";

const { Text, Paragraph, Link } = Typography;

export const ApiKeysPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<{ label: string }>();

  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiKey[]>("/portal/api-keys")
      .then((res) => setKeys(res.data ?? []))
      .catch(() => message.error("Failed to load API keys."))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const doCreate = async (values: { label: string }) => {
    setCreating(true);
    try {
      const { data } = await api.post<CreatedApiKey>("/portal/api-keys", {
        label: values.label,
      });
      setCreateOpen(false);
      form.resetFields();
      setCreatedKey(data);
      load();
    } catch {
      message.error("Failed to create API key.");
    } finally {
      setCreating(false);
    }
  };

  const doRevoke = async (id: string) => {
    try {
      await api.delete(`/portal/api-keys/${id}`);
      message.success("API key revoked.");
      load();
    } catch {
      message.error("Failed to revoke API key.");
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      message.success("API key copied to clipboard.");
    } catch {
      message.error("Could not copy the key.");
    }
  };

  return (
    <div>
      <PageHeader
        title="API keys"
        subtitle={
          <>
            Access the RapidCard.pro API programmatically. Full documentation is
            available at{" "}
            <Link href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
              <ApiOutlined /> {API_URL}/docs
            </Link>{" "}
            (Swagger).
          </>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Create key
          </Button>
        }
      />

      <SectionCard title="Your keys" noPadding>
        <Table<ApiKey>
          rowKey="id"
          dataSource={keys}
          loading={loading}
          scroll={{ x: true }}
          pagination={false}
          columns={[
            {
              title: "Label",
              dataIndex: "label",
              render: (v: string) => (
                <Space>
                  <KeyOutlined />
                  <Text strong>{v}</Text>
                </Space>
              ),
            },
            {
              title: "Prefix",
              dataIndex: "prefix",
              render: (v: string) => (
                <Text code style={{ fontFamily: "monospace" }}>
                  {v}…
                </Text>
              ),
            },
            {
              title: "Status",
              dataIndex: "isActive",
              render: (active: boolean) =>
                active ? (
                  <StatusPill status="Active" color="success" />
                ) : (
                  <StatusPill status="Revoked" color="neutral" />
                ),
            },
            {
              title: "Last used",
              dataIndex: "lastUsedAt",
              render: (v?: string | null) => (v ? formatDate(v) : "Never"),
            },
            {
              title: "Created",
              dataIndex: "createdAt",
              render: (v: string) => formatDate(v),
            },
            {
              title: "Actions",
              key: "actions",
              fixed: "right",
              render: (_: unknown, record) => (
                <Popconfirm
                  title="Revoke this API key?"
                  description="Applications using this key will immediately lose access."
                  okText="Revoke"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => doRevoke(record.id)}
                  disabled={!record.isActive}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!record.isActive}
                  >
                    Revoke
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </SectionCard>

      {/* Create modal */}
      <Modal
        title="Create API key"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="Create"
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={doCreate}>
          <Form.Item
            label="Label"
            name="label"
            rules={[{ required: true, message: "Please enter a label" }]}
            extra="A friendly name to identify this key (e.g. Production server)."
          >
            <Input placeholder="e.g. Production server" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reveal-once modal */}
      <Modal
        title="API key created"
        open={!!createdKey}
        onCancel={() => setCreatedKey(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setCreatedKey(null)}>
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
          <WarningOutlined style={{ color: BRAND.warning, fontSize: 18, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: "#92400E" }}>
              Save this key now
            </div>
            <div style={{ fontSize: 13, color: "#92400E", marginTop: 2 }}>
              This is the only time the full key will be shown. Store it securely —
              it cannot be retrieved again.
            </div>
          </div>
        </div>
        {createdKey && (
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
              Label
            </Text>
            <Paragraph strong style={{ marginTop: 2 }}>
              {createdKey.label}
            </Paragraph>
            <Divider style={{ margin: "12px 0" }} />
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: BRAND.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Secret key
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
                value={createdKey.key}
                className="tabular"
                style={{ fontFamily: "monospace" }}
              />
              <Tooltip title="Copy">
                <Button type="primary" icon={<CopyOutlined />} onClick={copyKey} />
              </Tooltip>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
