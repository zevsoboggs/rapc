import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, Empty, Typography, Tooltip, Timeline } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { api } from "../providers/axios";
import type { Shipment, ListResult, ShippingAddress } from "../types";
import { formatDate } from "../utils/format";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import { BRAND } from "../theme";

const { Text } = Typography;

const EVENT_LABEL: Record<string, string> = {
  pending: "Order placed",
  processing: "Preparing card",
  in_production: "Card produced",
  activation: "Activation codes assigned",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
};

const DeliveryTimeline: React.FC<{ s: Shipment }> = ({ s }) => {
  const events = s.events ?? [];
  if (!events.length)
    return (
      <div style={{ color: BRAND.textMuted, padding: "4px 0 4px 8px" }}>
        No tracking updates yet.
      </div>
    );
  return (
    <div style={{ padding: "6px 0 0 8px" }}>
      <Timeline
        items={events.map((e, i) => ({
          color: i === events.length - 1 ? BRAND.primary : "#94A3B8",
          dot:
            i === events.length - 1 ? (
              <CheckCircleFilled style={{ color: BRAND.primary }} />
            ) : undefined,
          children: (
            <div>
              <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>
                {EVENT_LABEL[e.status] || e.status}
              </div>
              <div style={{ fontSize: 13, color: BRAND.textSecondary }}>{e.note}</div>
              <div style={{ fontSize: 12, color: BRAND.textMuted }}>{formatDate(e.at)}</div>
            </div>
          ),
        }))}
      />
      {s.trackingUrl && (
        <a href={s.trackingUrl} target="_blank" rel="noreferrer" style={{ color: BRAND.primary, fontWeight: 500 }}>
          Track on carrier site ↗
        </a>
      )}
    </div>
  );
};

const oneLine = (a?: ShippingAddress | null) =>
  a
    ? [a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
        .filter(Boolean)
        .join(", ")
    : "—";

export const DeliveriesPage: React.FC = () => {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ListResult<Shipment>>("/portal/shipments", { params: { limit: 100 } })
      .then((res) => setItems(res.data.items ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Shipment status of your physical cards."
      />

      <SectionCard noPadding>
        {loading ? (
          <div style={{ padding: 24 }}>
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48 }}>
            <Empty description="No physical card deliveries yet." />
          </div>
        ) : (
          <Table<Shipment>
            rowKey="id"
            dataSource={items}
            pagination={false}
            scroll={{ x: true }}
            expandable={{
              expandedRowRender: (r) => <DeliveryTimeline s={r} />,
              rowExpandable: (r) => (r.events?.length ?? 0) > 0,
            }}
            columns={[
              {
                title: "Card",
                render: (_, r) =>
                  r.card ? (
                    <Link to={`/cards/${r.cardId}`}>
                      <Text className="tabular" style={{ fontFamily: "monospace", color: BRAND.primary }}>
                        {r.card.maskedPan || r.cardId.slice(0, 8)}
                      </Text>
                    </Link>
                  ) : (
                    "—"
                  ),
              },
              { title: "Program", render: (_, r) => r.program?.name ?? "—" },
              { title: "Recipient", dataIndex: "recipientName", render: (v) => v || "—" },
              {
                title: "Address",
                render: (_, r) => (
                  <Tooltip title={oneLine(r.address)}>
                    <span style={{ display: "inline-block", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "bottom", color: BRAND.textSecondary }}>
                      {oneLine(r.address)}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (v: string) => <StatusPill kind="shipment" status={v} />,
              },
              {
                title: "Carrier / Tracking",
                render: (_, r) =>
                  r.trackingNumber ? (
                    <span>
                      {r.carrier ? `${r.carrier} · ` : ""}
                      {r.trackingUrl ? (
                        <a href={r.trackingUrl} target="_blank" rel="noreferrer" className="tabular" style={{ fontFamily: "monospace", color: BRAND.primary }}>
                          {r.trackingNumber}
                        </a>
                      ) : (
                        <Text className="tabular" style={{ fontFamily: "monospace" }}>{r.trackingNumber}</Text>
                      )}
                    </span>
                  ) : (
                    <Text type="secondary">Not shipped yet</Text>
                  ),
              },
              { title: "Ordered", dataIndex: "createdAt", render: (v: string) => formatDate(v) },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
};
