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
  Checkbox,
  InputNumber,
  Tag,
  Collapse,
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

const SCOPE_LABELS: Record<string, string> = {
  "balance:read": "Read balance",
  "cards:read": "Read cards",
  "cards:write": "Manage cards (issue, top-up, withdraw)",
  "deposits:read": "Read deposits",
  "deposits:write": "Create deposits",
};

const codeBox: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 12,
  padding: 16,
  fontFamily: "monospace",
  fontSize: 12.5,
  lineHeight: 1.6,
  overflowX: "auto",
  whiteSpace: "pre",
};

export const ApiKeysPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopes, setScopes] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<{ label: string; scopes: string[]; expiresInDays?: number }>();

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
    api
      .get<{ value: string }[]>("/portal/api-key-scopes")
      .then((res) => setScopes((res.data ?? []).map((s) => s.value)))
      .catch(() => setScopes(["balance:read", "cards:read", "cards:write", "deposits:read", "deposits:write"]));
  }, [load]);

  const doCreate = async (values: { label: string; scopes: string[]; expiresInDays?: number }) => {
    setCreating(true);
    try {
      const { data } = await api.post<CreatedApiKey>("/portal/api-keys", {
        label: values.label,
        scopes: values.scopes,
        expiresInDays: values.expiresInDays,
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

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied.`);
    } catch {
      message.error(`Could not copy ${label}.`);
    }
  };

  const hasLegacy = keys.some((k) => k.legacy && k.isActive);

  return (
    <div>
      <PageHeader
        title="API keys"
        subtitle={
          <>
            Access the RapidCard.pro API programmatically. Full documentation at{" "}
            <Link href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
              <ApiOutlined /> {API_URL}/docs
            </Link>
            .
          </>
        }
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Create key</Button>}
      />

      {hasLegacy && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: BRAND.warningSoft, border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
          <WarningOutlined style={{ color: BRAND.warning, fontSize: 18, marginTop: 2 }} />
          <div style={{ color: "#92400E" }}>
            <div style={{ fontWeight: 600 }}>Legacy keys detected</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              We upgraded API authentication to key + secret with request signing. Legacy keys no
              longer authenticate — create a new key and update your integration.
            </div>
          </div>
        </div>
      )}

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
              render: (v: string, r) => (
                <Space>
                  <KeyOutlined />
                  <Text strong>{v}</Text>
                  {r.legacy && <Tag color="warning">Legacy</Tag>}
                </Space>
              ),
            },
            {
              title: "Key ID",
              dataIndex: "keyId",
              render: (v: string) => <Text code style={{ fontFamily: "monospace" }}>{v}</Text>,
            },
            {
              title: "Scopes",
              dataIndex: "scopes",
              render: (v?: string[]) => (
                <Space size={4} wrap>
                  {(v ?? []).map((s) => <Tag key={s} style={{ marginInlineEnd: 0 }}>{s}</Tag>)}
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "isActive",
              render: (active: boolean, r) =>
                !active ? (
                  <StatusPill status="Revoked" color="neutral" />
                ) : r.legacy ? (
                  <StatusPill status="Reissue required" color="warning" />
                ) : (
                  <StatusPill status="Active" color="success" />
                ),
            },
            { title: "Last used", dataIndex: "lastUsedAt", render: (v?: string | null) => (v ? formatDate(v) : "Never") },
            { title: "Created", dataIndex: "createdAt", render: (v: string) => formatDate(v) },
            {
              title: "",
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
                  <Button size="small" danger icon={<DeleteOutlined />} disabled={!record.isActive}>Revoke</Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </SectionCard>

      {/* Authentication guide */}
      <div style={{ marginTop: 20 }}>
        <SectionCard title="How to authenticate">
          <Collapse
            ghost
            defaultActiveKey={["simple"]}
            items={[
              {
                key: "simple",
                label: <b>Simple — secret key bearer</b>,
                children: (
                  <div>
                    <Paragraph type="secondary">Send your secret key (<Text code>sk_live_…</Text>) as a Bearer token over HTTPS.</Paragraph>
                    <div style={codeBox}>{`curl ${API_URL}/api/v1/balance \\
  -H "Authorization: Bearer sk_live_your_secret"`}</div>
                  </div>
                ),
              },
              {
                key: "signed",
                label: <b>Signed requests (recommended)</b>,
                children: (
                  <div>
                    <Paragraph type="secondary">
                      Sign each request with your secret using HMAC-SHA256. Send the key id, a
                      millisecond timestamp (valid ±5 min) and the signature.
                    </Paragraph>
                    <div style={codeBox}>{`message = METHOD + "\\n" + PATH + "\\n" + TIMESTAMP + "\\n" + SHA256_HEX(body)
signature = HMAC_SHA256(secret, message)  // hex

# headers
X-API-Key: rk_live_your_key_id
X-API-Timestamp: 1721400000000
X-API-Signature: <signature>`}</div>
                    <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                      PATH includes the query string; body is the exact request bytes (empty for GET).
                      Scopes are enforced per endpoint.
                    </Paragraph>
                  </div>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>

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
        <Form form={form} layout="vertical" onFinish={doCreate} initialValues={{ scopes: ["cards:read", "cards:write"] }}>
          <Form.Item label="Label" name="label" rules={[{ required: true, message: "Please enter a label" }]} extra="A friendly name to identify this key.">
            <Input placeholder="e.g. Production server" />
          </Form.Item>
          <Form.Item label="Scopes" name="scopes" rules={[{ required: true, message: "Select at least one scope" }]}>
            <Checkbox.Group style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scopes.map((s) => (
                <Checkbox key={s} value={s}>
                  <Text code style={{ fontFamily: "monospace" }}>{s}</Text> <Text type="secondary">— {SCOPE_LABELS[s] || s}</Text>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
          <Form.Item label="Expiry (days)" name="expiresInDays" extra="Optional. Leave empty for a non-expiring key.">
            <InputNumber style={{ width: "100%" }} min={1} max={3650} placeholder="Never" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reveal-once modal */}
      <Modal
        title="API key created"
        open={!!createdKey}
        onCancel={() => setCreatedKey(null)}
        footer={[<Button key="close" type="primary" onClick={() => setCreatedKey(null)}>I have saved it</Button>]}
        closable
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: BRAND.warningSoft, border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
          <WarningOutlined style={{ color: BRAND.warning, fontSize: 18, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: "#92400E" }}>Save your secret now</div>
            <div style={{ fontSize: 13, color: "#92400E", marginTop: 2 }}>
              This is the only time the secret is shown. It cannot be retrieved again.
            </div>
          </div>
        </div>
        {createdKey && (
          <>
            <FieldLabel>Key ID (public)</FieldLabel>
            <KeyLine value={createdKey.keyId} onCopy={() => copy(createdKey.keyId, "Key ID")} />
            <Divider style={{ margin: "14px 0" }} />
            <FieldLabel>Secret key (shown once)</FieldLabel>
            <KeyLine value={createdKey.secret} onCopy={() => copy(createdKey.secret, "Secret key")} />
            <div style={{ marginTop: 14 }}>
              <FieldLabel>Scopes</FieldLabel>
              <Space size={4} wrap>{createdKey.scopes.map((s) => <Tag key={s}>{s}</Tag>)}</Space>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}</Text>
);

const KeyLine: React.FC<{ value: string; onCopy: () => void }> = ({ value, onCopy }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
    <Input readOnly value={value} className="tabular" style={{ fontFamily: "monospace" }} />
    <Tooltip title="Copy"><Button type="primary" icon={<CopyOutlined />} onClick={onCopy} /></Tooltip>
  </div>
);
