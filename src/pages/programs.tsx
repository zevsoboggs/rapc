import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Empty,
  App as AntdApp,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
} from "antd";
import { PlusOutlined, InboxOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../providers/axios";
import type { Program, BatchOrder } from "../types";
import { formatMoney } from "../utils/format";
import { CardTypeTag } from "../components/CardTypeTag";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { CardVisual } from "../components/CardVisual";
import { ProgramCardSkeleton } from "../components/Skeletons";
import { CARD_SHADOW, BRAND } from "../theme";

const Fee: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
    <span style={{ color: BRAND.textMuted, fontSize: 13 }}>{label}</span>
    <span className="tabular" style={{ color: BRAND.textPrimary, fontWeight: 600, fontSize: 13.5 }}>{value}</span>
  </div>
);

export const ProgramsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const [batchProgram, setBatchProgram] = useState<Program | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [batchForm] = Form.useForm<{ quantity: number; notes?: string }>();
  const quantity = Form.useWatch("quantity", batchForm);

  useEffect(() => {
    api
      .get<Program[]>("/portal/programs")
      .then((res) => setPrograms(res.data ?? []))
      .catch(() => message.error("Failed to load programs."))
      .finally(() => setLoading(false));
  }, [message]);

  const unitCost = batchProgram
    ? (parseFloat(batchProgram.issuanceFee ?? "0") || 0) +
      (parseFloat(batchProgram.shippingFee ?? "0") || 0)
    : 0;
  const estimatedCost = unitCost * (Number(quantity) || 0);

  const openBatch = (program: Program) => {
    batchForm.resetFields();
    setBatchProgram(program);
  };

  const submitBatch = async (values: { quantity: number; notes?: string }) => {
    if (!batchProgram) return;
    setOrdering(true);
    try {
      await api.post<BatchOrder>("/portal/batch-orders", {
        programId: batchProgram.id,
        quantity: values.quantity,
        notes: values.notes,
      });
      message.success("Batch order placed.");
      setBatchProgram(null);
      batchForm.resetFields();
      navigate("/batch-orders");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to place batch order.";
      message.error(msg);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Card programs"
        subtitle="Card programs assigned and enabled for your account."
      />

      {loading ? (
        <Row gutter={[20, 20]}>
          {[0, 1, 2].map((i) => (
            <Col key={i} xs={24} md={12} xl={8}>
              <ProgramCardSkeleton />
            </Col>
          ))}
        </Row>
      ) : programs.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${BRAND.borderSubtle}`, boxShadow: CARD_SHADOW, borderRadius: 16, padding: 60 }}>
          <Empty description="No programs assigned yet." />
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          {programs.map((p) => (
            <Col key={p.id} xs={24} md={12} xl={8}>
              <div className="rc-elevate" style={{ background: "#fff", border: `1px solid ${BRAND.borderSubtle}`, boxShadow: CARD_SHADOW, borderRadius: 16, padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
                {/* Card artwork preview */}
                <CardVisual
                  program={p}
                  width="100%"
                  face={{
                    artworkSvg: p.artworkSvg,
                    cardColor: p.cardColor,
                    last4: "0000",
                    holder: p.name.toUpperCase(),
                    network: p.network,
                    cardType: p.cardType,
                  }}
                />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, margin: "16px 0 4px" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: BRAND.textPrimary }}>{p.name}</div>
                    {p.network && <div style={{ fontSize: 12.5, color: BRAND.textMuted }}>{p.network} · {p.currency}</div>}
                  </div>
                  <CardTypeTag cardType={p.cardType} />
                </div>

                {p.description && (
                  <p style={{ margin: "6px 0 12px", color: BRAND.textSecondary, fontSize: 13.5, lineHeight: 1.5 }}>{p.description}</p>
                )}

                <div style={{ marginTop: "auto" }}>
                  <Fee label="BIN" value={<span style={{ fontFamily: "monospace" }}>{p.bin || "—"}</span>} />
                  <Fee label="Issuance fee" value={formatMoney(p.issuanceFee, p.currency)} />
                  {p.cardType === "PHYSICAL" && <Fee label="Shipping fee" value={formatMoney(p.shippingFee, p.currency)} />}
                  <Fee label="Top-up fee" value={`${p.topupFeePercent ?? "0"}%`} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 4px" }}>
                    <span style={{ color: BRAND.textMuted, fontSize: 13 }}>Top-up limits</span>
                    <span className="tabular" style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {formatMoney(p.minTopup, p.currency)} – {formatMoney(p.maxTopup, p.currency)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 12 }}>
                    <StatusPill status="Enabled" color="success" />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {p.cardType === "PHYSICAL" && (
                        <Button icon={<InboxOutlined />} onClick={() => openBatch(p)}>
                          Order batch
                        </Button>
                      )}
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/cards?issue=${p.id}`)}>
                        Issue card
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Order batch modal */}
      <Modal
        title={
          batchProgram ? `Order card batch — ${batchProgram.name}` : "Order card batch"
        }
        open={!!batchProgram}
        onCancel={() => setBatchProgram(null)}
        onOk={() => batchForm.submit()}
        okText="Place order"
        confirmLoading={ordering}
        destroyOnClose
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={submitBatch}
          initialValues={{ quantity: 10 }}
        >
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Please enter a quantity" }]}
            extra="Number of physical cards to produce (1–1000)."
          >
            <InputNumber style={{ width: "100%" }} min={1} max={1000} step={10} />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              marginBottom: 16,
              background: BRAND.primarySoft,
              border: `1px solid ${BRAND.primarySoft2}`,
              borderRadius: 12,
            }}
          >
            <span style={{ color: BRAND.textSecondary, fontSize: 13 }}>
              Estimated cost
            </span>
            <span
              className="tabular"
              style={{ fontWeight: 700, fontSize: 15, color: BRAND.textPrimary }}
            >
              {formatMoney(estimatedCost, batchProgram?.currency)}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginTop: -8, marginBottom: 14 }}>
            {formatMoney(unitCost, batchProgram?.currency)} per card ×{" "}
            {Number(quantity) || 0}. Debited from your balance on order.
          </div>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Optional notes for this order…" maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
