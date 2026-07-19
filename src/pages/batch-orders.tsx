import { useCallback, useEffect, useState } from "react";
import { Table, Button, Typography, Empty, App as AntdApp } from "antd";
import { ReloadOutlined, InboxOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../providers/axios";
import type { BatchOrder } from "../types";
import { formatDate } from "../utils/format";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { MoneyText } from "../components/MoneyText";
import { TableSkeleton } from "../components/Skeletons";

const { Text } = Typography;

const STATUS_META: Record<
  BatchOrder["status"],
  { color: "warning" | "info" | "success" | "neutral"; label: string }
> = {
  requested: { color: "warning", label: "Requested" },
  in_production: { color: "info", label: "In production" },
  completed: { color: "success", label: "Completed" },
  cancelled: { color: "neutral", label: "Cancelled" },
};

export const BatchOrdersPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState<BatchOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<BatchOrder[]>("/portal/batch-orders")
      .then((res) => setItems(res.data ?? []))
      .catch(() => message.error("Failed to load batch orders."))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Card batches"
        subtitle="Order and track batches of physical cards for your programs."
        extra={
          <>
            <Button icon={<ReloadOutlined />} onClick={load}>
              Refresh
            </Button>
            <Button type="primary" onClick={() => navigate("/programs")}>
              Order batch
            </Button>
          </>
        }
      />

      <SectionCard title="Batch orders" noPadding>
        {loading ? (
          <div style={{ padding: 24 }}>
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Empty
              image={<InboxOutlined style={{ fontSize: 48, color: "#CBD5E1" }} />}
              description="No batch orders yet."
            />
            <Button
              type="primary"
              style={{ marginTop: 12 }}
              onClick={() => navigate("/programs")}
            >
              Order a batch
            </Button>
          </div>
        ) : (
          <Table<BatchOrder>
            rowKey="id"
            dataSource={items}
            scroll={{ x: true }}
            pagination={false}
            columns={[
              {
                title: "Quantity",
                dataIndex: "quantity",
                align: "right",
                render: (v: number) => (
                  <Text strong className="tabular">
                    {v.toLocaleString("en-US")}
                  </Text>
                ),
                width: 120,
              },
              {
                title: "Program",
                key: "program",
                render: (_: unknown, r) => (
                  <Text strong>{r.program?.name ?? "—"}</Text>
                ),
              },
              {
                title: "Total cost",
                dataIndex: "totalCost",
                align: "right",
                render: (v?: string | null) =>
                  v != null ? <MoneyText value={v} strong /> : "—",
                width: 140,
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: BatchOrder["status"]) => {
                  const m = STATUS_META[v] ?? STATUS_META.requested;
                  return (
                    <StatusPill
                      kind="generic"
                      status={v}
                      color={m.color}
                      label={m.label}
                    />
                  );
                },
                width: 150,
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                render: (v: string) => formatDate(v),
                width: 180,
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
};
