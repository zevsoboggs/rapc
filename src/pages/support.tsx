import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Drawer,
  Modal,
  Form,
  Input,
  Select,
  Empty,
  Popconfirm,
  App as AntdApp,
} from "antd";
import { PlusOutlined, SendOutlined, MessageOutlined } from "@ant-design/icons";
import { api } from "../providers/axios";
import type { Ticket } from "../types";
import { formatDate } from "../utils/format";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import { BRAND } from "../theme";

const PRIORITY: Record<string, { color: "neutral" | "warning" | "error"; label: string }> = {
  low: { color: "neutral", label: "Low" },
  normal: { color: "neutral", label: "Normal" },
  high: { color: "error", label: "High" },
};

export const SupportPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const [active, setActive] = useState<Ticket | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Ticket[]>("/portal/tickets")
      .then((res) => setItems(res.data ?? []))
      .catch(() => message.error("Failed to load tickets."))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const openThread = (id: string) => {
    setThreadLoading(true);
    setActive({ id } as Ticket);
    api
      .get<Ticket>(`/portal/tickets/${id}`)
      .then((res) => setActive(res.data))
      .catch(() => message.error("Failed to open ticket."))
      .finally(() => setThreadLoading(false));
  };

  const createTicket = async (values: { subject: string; priority?: string; message: string }) => {
    setCreating(true);
    try {
      const { data } = await api.post<Ticket>("/portal/tickets", values);
      message.success("Ticket created.");
      setNewOpen(false);
      form.resetFields();
      load();
      openThread(data.id);
    } catch {
      message.error("Failed to create ticket.");
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/portal/tickets/${active.id}/messages`, { body: reply.trim() });
      setReply("");
      const { data } = await api.get<Ticket>(`/portal/tickets/${active.id}`);
      setActive(data);
      load();
    } catch {
      message.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!active) return;
    await api.post(`/portal/tickets/${active.id}/close`);
    message.success("Ticket closed.");
    const { data } = await api.get<Ticket>(`/portal/tickets/${active.id}`);
    setActive(data);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Contact our team and track your requests."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewOpen(true)}>
            New ticket
          </Button>
        }
      />

      <SectionCard noPadding>
        {loading ? (
          <div style={{ padding: 24 }}>
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty description="No tickets yet." />
            <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => setNewOpen(true)}>
              Open a ticket
            </Button>
          </div>
        ) : (
          <Table<Ticket>
            rowKey="id"
            dataSource={items}
            pagination={false}
            onRow={(r) => ({ onClick: () => openThread(r.id), style: { cursor: "pointer" } })}
            columns={[
              {
                title: "Subject",
                dataIndex: "subject",
                render: (v: string) => <span style={{ fontWeight: 600, color: BRAND.textPrimary }}>{v}</span>,
              },
              {
                title: "Priority",
                dataIndex: "priority",
                render: (v: string) => {
                  const p = PRIORITY[v] ?? PRIORITY.normal;
                  return <StatusPill status={v} color={p.color} label={p.label} dot={false} />;
                },
              },
              { title: "Status", dataIndex: "status", render: (v: string) => <StatusPill kind="ticket" status={v} /> },
              { title: "Messages", dataIndex: ["_count", "messages"], align: "center", render: (_: unknown, r) => r._count?.messages ?? 0 },
              { title: "Last update", dataIndex: "lastMessageAt", render: (v: string) => formatDate(v) },
            ]}
          />
        )}
      </SectionCard>

      {/* New ticket modal */}
      <Modal
        title="New support ticket"
        open={newOpen}
        onCancel={() => setNewOpen(false)}
        okText="Create"
        confirmLoading={creating}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={createTicket} requiredMark>
          <Form.Item name="subject" label="Subject" rules={[{ required: true, message: "Enter a subject" }]}>
            <Input placeholder="Short summary of your issue" maxLength={200} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="normal">
            <Select
              options={[
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ]}
            />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true, message: "Describe your issue" }]}>
            <Input.TextArea rows={5} placeholder="Describe your issue in detail…" maxLength={5000} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Ticket thread drawer */}
      <Drawer
        title={active?.subject || "Ticket"}
        width={520}
        open={!!active}
        onClose={() => setActive(null)}
        extra={
          active?.status !== "closed" && active?.messages ? (
            <Popconfirm title="Close this ticket?" okText="Close" onConfirm={closeTicket}>
              <Button size="small">Close ticket</Button>
            </Popconfirm>
          ) : null
        }
      >
        {threadLoading || !active?.messages ? (
          <div style={{ color: BRAND.textMuted, textAlign: "center", padding: 40 }}>
            <MessageOutlined style={{ fontSize: 28 }} />
            <div style={{ marginTop: 8 }}>Loading conversation…</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ marginBottom: 12 }}>
              <StatusPill kind="ticket" status={active.status} />
            </div>
            <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {active.messages.map((m) => {
                const mine = m.authorType === "client";
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "10px 14px",
                        borderRadius: 14,
                        background: mine ? BRAND.primary : "#F1F5F9",
                        color: mine ? "#fff" : BRAND.textPrimary,
                        borderTopRightRadius: mine ? 4 : 14,
                        borderTopLeftRadius: mine ? 14 : 4,
                      }}
                    >
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
                        {mine ? "You" : m.authorName || "Support"} · {formatDate(m.createdAt)}
                      </div>
                      <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {active.status !== "closed" && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${BRAND.borderSubtle}`, paddingTop: 14 }}>
                <Input.TextArea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply…"
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <Button type="primary" icon={<SendOutlined />} loading={sending} disabled={!reply.trim()} onClick={sendReply}>
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
