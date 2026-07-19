import { useEffect, useMemo, useState } from "react";
import React from "react";
import {
  Empty,
  App as AntdApp,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Segmented,
  Collapse,
  Grid,
  Drawer,
} from "antd";
import {
  InboxOutlined,
  CloseCircleFilled,
  RightOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../providers/axios";
import type { Program, BatchOrder } from "../types";
import { formatMoney } from "../utils/format";
import { ProgramTile } from "../components/ProgramTile";
import { ProgramCardSkeleton } from "../components/Skeletons";
import { ServiceIcon } from "../components/ServiceIcon";
import {
  servicesForProgram,
  PROHIBITED_SERVICES,
  PROHIBITED_COUNTRIES,
  PROHIBITED_CATEGORIES,
} from "../data/compliance";
import { BRAND, CARD_SHADOW } from "../theme";

interface ListView {
  title: string;
  subtitle?: string;
  items: { icon: React.ReactNode; label: string }[];
}

const cardBox: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${BRAND.borderSubtle}`,
  boxShadow: CARD_SHADOW,
  borderRadius: 18,
};

// Soft-lavender primary action pill, matching the mockup's "Get card" button.
const getBtn: React.CSSProperties = {
  height: 44,
  padding: "0 26px",
  borderRadius: 12,
  border: "none",
  background: BRAND.primarySoft,
  color: BRAND.primary,
  fontWeight: 600,
  fontSize: 15,
};

const Fee: React.FC<{ value: React.ReactNode; label: string }> = ({ value, label }) => (
  <div style={{ minWidth: 78 }}>
    <div className="tabular" style={{ fontSize: 20, fontWeight: 700, color: BRAND.textPrimary }}>{value}</div>
    <div style={{ fontSize: 13, color: BRAND.textMuted, marginTop: 2 }}>{label}</div>
  </div>
);

export const ProgramsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"categories" | "bin">("categories");

  const [detail, setDetail] = useState<Program | null>(null);
  const [tariffsOpen, setTariffsOpen] = useState(false);
  const [list, setList] = useState<ListView | null>(null);

  const [batchProgram, setBatchProgram] = useState<Program | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [batchForm] = Form.useForm<{ quantity: number; notes?: string }>();
  const quantity = Form.useWatch("quantity", batchForm);

  const openDetail = (p: Program) => { setTariffsOpen(false); setDetail(p); };
  const codeToFlag = (code: string) =>
    /^[A-Za-z]{2}$/.test(code)
      ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
      : "🏴";
  const flagIcon = (code: string) => (
    <span style={{ width: 40, height: 40, borderRadius: "50%", background: BRAND.appBg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{codeToFlag(code)}</span>
  );
  const xIcon = (
    <span style={{ width: 40, height: 40, borderRadius: "50%", background: BRAND.errorSoft, color: BRAND.error, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><CloseCircleFilled /></span>
  );
  const showServices = (p: Program) => setList({ title: "Services & subscriptions", subtitle: "Works best with these services:", items: servicesForProgram(p).map((s) => ({ icon: <ServiceIcon service={s} />, label: s.name })) });
  const showProhServices = () => setList({ title: "Prohibited services", subtitle: "These services are not supported:", items: PROHIBITED_SERVICES.map((s) => ({ icon: <ServiceIcon service={s} />, label: s.name })) });
  const showCountries = () => setList({ title: "Prohibited countries", subtitle: "Payments in these regions are declined:", items: PROHIBITED_COUNTRIES.map((c) => ({ icon: flagIcon(c.code), label: c.name })) });
  const showCategories = () => setList({ title: "Prohibited categories", subtitle: "These merchant categories are blocked:", items: PROHIBITED_CATEGORIES.map((c) => ({ icon: xIcon, label: c })) });

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
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to place batch order.";
      message.error(msg);
    } finally {
      setOrdering(false);
    }
  };

  const narrow = !screens.lg;

  const infoPanel = useMemo(
    () => (
      <div style={{ ...cardBox, overflow: "hidden" }}>
        <Collapse
          ghost
          expandIconPosition="end"
          defaultActiveKey={screens.lg ? undefined : undefined}
          items={[
            {
              key: "diff",
              label: <span style={{ fontWeight: 700, fontSize: 16, color: BRAND.textPrimary }}>How do card categories differ?</span>,
              children: (
                <div style={{ color: BRAND.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
                  <p style={{ marginTop: 0 }}>
                    Each category is tuned for a specific type of spend. The category
                    determines the BIN range, the accepted merchant profile and the fee
                    schedule applied to issuance and top-ups.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    Pick the category that matches your use case — advertising accounts,
                    subscriptions, or general purchases — and issue as many cards as you need.
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>
    ),
    [screens.lg],
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", color: BRAND.textPrimary }}>
          Available cards
        </h1>
        <Segmented
          size="large"
          value={tab}
          onChange={(v) => setTab(v as "categories" | "bin")}
          options={[
            { label: "Categories", value: "categories" },
            { label: "BIN", value: "bin" },
          ]}
        />
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left: list */}
        <div style={{ flex: "1 1 560px", minWidth: 300, display: "flex", flexDirection: "column", gap: 18 }}>
          {loading ? (
            [0, 1, 2].map((i) => <ProgramCardSkeleton key={i} />)
          ) : programs.length === 0 ? (
            <div style={{ ...cardBox, padding: 60 }}>
              <Empty description="No card programs assigned yet." />
            </div>
          ) : tab === "categories" ? (
            programs.map((p) => (
              <div key={p.id} onClick={() => openDetail(p)} className="rc-elevate" style={{ ...cardBox, padding: 20, display: "flex", gap: 22, alignItems: "stretch", flexWrap: narrow ? "wrap" : "nowrap", cursor: "pointer" }}>
                <div style={{ width: narrow ? "100%" : 240, flexShrink: 0 }}>
                  <ProgramTile name={p.name} seed={p.id} color={p.cardColor} artworkSvg={p.artworkSvg} height={narrow ? 150 : 168} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: BRAND.textPrimary, letterSpacing: "-0.01em" }}>{p.name}</div>
                    {p.description && (
                      <p style={{ margin: "8px 0 0", color: BRAND.textSecondary, fontSize: 14.5, lineHeight: 1.55 }}>{p.description}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                    <Fee value={formatMoney(p.issuanceFee, p.currency)} label="Per issue" />
                    <div style={{ width: 1, height: 40, background: BRAND.borderSubtle }} />
                    <Fee value={`${p.topupFeePercent ?? "0"}%`} label="On top-up" />
                    <div style={{ flex: 1 }} />
                    {p.cardType === "PHYSICAL" && (
                      <Button icon={<InboxOutlined />} style={{ height: 44, borderRadius: 12 }} onClick={(e) => { e.stopPropagation(); openBatch(p); }}>
                        Order batch
                      </Button>
                    )}
                    <button
                      style={getBtn}
                      onClick={(e) => { e.stopPropagation(); navigate(`/cards?issue=${p.id}`); }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primarySoft2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.primarySoft)}
                    >
                      Get card
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // BIN view
            <div style={{ ...cardBox, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 130px", gap: 12, padding: "16px 22px", color: BRAND.textMuted, fontSize: 13, borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
                <span>Program</span><span>BIN</span><span>Issue</span><span>Top-up</span><span />
              </div>
              {programs.map((p) => (
                <div key={p.id} onClick={() => openDetail(p)} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 130px", gap: 12, padding: "16px 22px", alignItems: "center", borderBottom: `1px solid ${BRAND.borderSubtle}`, cursor: "pointer" }}>
                  <span style={{ fontWeight: 600, color: BRAND.textPrimary }}>{p.name}</span>
                  <span className="tabular" style={{ fontFamily: "monospace", color: BRAND.textSecondary }}>{p.bin || "—"}</span>
                  <span className="tabular" style={{ color: BRAND.textSecondary }}>{formatMoney(p.issuanceFee, p.currency)}</span>
                  <span className="tabular" style={{ color: BRAND.textSecondary }}>{p.topupFeePercent ?? "0"}%</span>
                  <button style={{ ...getBtn, height: 38, padding: "0 16px", fontSize: 14 }} onClick={(e) => { e.stopPropagation(); navigate(`/cards?issue=${p.id}`); }}>Get card</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: info */}
        <div style={{ flex: narrow ? "1 1 100%" : "0 0 340px", width: narrow ? "100%" : 340 }}>
          {infoPanel}
        </div>
      </div>

      {/* Program details drawer */}
      <Drawer
        title={detail?.name}
        placement="right"
        width={460}
        open={!!detail}
        onClose={() => setDetail(null)}
        footer={detail ? (
          <Button type="primary" block style={{ height: 48, borderRadius: 12, fontWeight: 600 }} onClick={() => { const id = detail.id; setDetail(null); navigate(`/cards?issue=${id}`); }}>
            Get card
          </Button>
        ) : null}
      >
        {detail && (() => {
          const svc = servicesForProgram(detail);
          const preview = svc.slice(0, 4);
          const more = svc.length - preview.length;
          const rowBtn: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, cursor: "pointer" };
          return (
            <div>
              {detail.description && <p style={{ color: BRAND.textSecondary, fontSize: 14.5, lineHeight: 1.55, marginTop: 0 }}>{detail.description}</p>}

              {/* Works with */}
              <button onClick={() => showServices(detail)} style={rowBtn}>
                <span style={{ color: BRAND.primary, fontWeight: 600 }}>Works with</span>
                <span style={{ display: "flex", alignItems: "center" }}>
                  {preview.map((s, i) => <span key={s.name} style={{ marginLeft: i ? -10 : 0 }}><ServiceIcon service={s} size={30} /></span>)}
                  {more > 0 && <span style={{ marginLeft: -10, width: 30, height: 30, borderRadius: "50%", background: "#fff", border: `1px solid ${BRAND.borderSubtle}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: BRAND.textSecondary }}>+{more > 99 ? 99 : more}</span>}
                </span>
              </button>

              {/* Digital wallets */}
              {(detail.applePay || detail.googlePay) && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
                  <span style={{ color: BRAND.textSecondary, fontWeight: 600 }}>Digital wallets</span>
                  <span style={{ display: "flex", gap: 8 }}>
                    {detail.applePay && <WalletChip label="Apple Pay" glyph="" />}
                    {detail.googlePay && <WalletChip label="Google Pay" glyph="G" />}
                  </span>
                </div>
              )}

              {/* Tariffs & conditions */}
              <button onClick={() => setTariffsOpen((v) => !v)} style={{ ...rowBtn, marginBottom: tariffsOpen ? 4 : 12 }}>
                <span style={{ color: BRAND.primary, fontWeight: 600 }}>Tariffs & conditions</span>
                <QuestionCircleOutlined style={{ color: BRAND.textMuted, fontSize: 18 }} />
              </button>
              {tariffsOpen && (
                <div style={{ padding: "0 4px 12px", fontSize: 14 }}>
                  <Line label="Issuance fee" value={formatMoney(detail.issuanceFee, detail.currency)} />
                  {detail.cardType === "PHYSICAL" && <Line label="Shipping fee" value={formatMoney(detail.shippingFee, detail.currency)} />}
                  <Line label="Top-up fee" value={`${detail.topupFeePercent ?? "0"}%`} />
                  <Line label="Withdraw fee" value={`${detail.withdrawFeePercent ?? "0"}%`} />
                  <Line label="Top-up limits" value={`${formatMoney(detail.minTopup, detail.currency)} – ${formatMoney(detail.maxTopup, detail.currency)}`} />
                  <Line label="BIN" value={detail.bin || "—"} mono />
                </div>
              )}

              {/* Prohibited */}
              <div style={{ borderTop: `1px solid ${BRAND.borderSubtle}`, marginTop: 8 }}>
                <ProhRow label="Prohibited services" onShow={showProhServices} />
                <ProhRow label="Prohibited countries" onShow={showCountries} />
                <ProhRow label="Prohibited categories" onShow={showCategories} />
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* Services / prohibited list drawer */}
      <Drawer
        title={list?.title}
        placement="right"
        width={420}
        open={!!list}
        onClose={() => setList(null)}
        zIndex={1100}
        footer={
          <Button type="primary" block icon={<MessageOutlined />} style={{ height: 48, borderRadius: 12, fontWeight: 600 }} onClick={() => { setList(null); setDetail(null); navigate("/support"); }}>
            Support
          </Button>
        }
      >
        {list?.subtitle && <p style={{ color: BRAND.textMuted, fontSize: 14, marginTop: 0, marginBottom: 8 }}>{list.subtitle}</p>}
        {list?.items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
            {it.icon}
            <span style={{ fontWeight: 500, color: BRAND.textPrimary, fontSize: 15 }}>{it.label}</span>
          </div>
        ))}
      </Drawer>

      {/* Order batch modal */}
      <Modal
        title={batchProgram ? `Order card batch — ${batchProgram.name}` : "Order card batch"}
        open={!!batchProgram}
        onCancel={() => setBatchProgram(null)}
        onOk={() => batchForm.submit()}
        okText="Place order"
        confirmLoading={ordering}
        destroyOnClose
      >
        <Form form={batchForm} layout="vertical" onFinish={submitBatch} initialValues={{ quantity: 10 }}>
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Please enter a quantity" }]}
            extra="Number of physical cards to produce (1–1000)."
          >
            <InputNumber style={{ width: "100%" }} min={1} max={1000} step={10} />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", marginBottom: 16, background: BRAND.primarySoft, border: `1px solid ${BRAND.primarySoft2}`, borderRadius: 12 }}>
            <span style={{ color: BRAND.textSecondary, fontSize: 13 }}>Estimated cost</span>
            <span className="tabular" style={{ fontWeight: 700, fontSize: 15, color: BRAND.textPrimary }}>
              {formatMoney(estimatedCost, batchProgram?.currency)}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginTop: -8, marginBottom: 14 }}>
            {formatMoney(unitCost, batchProgram?.currency)} per card × {Number(quantity) || 0}. Debited from your balance on order.
          </div>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Optional notes for this order…" maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const WalletChip: React.FC<{ label: string; glyph: string }> = ({ label, glyph }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#0f172a", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>
    <span style={{ fontSize: 14 }}>{glyph}</span>
    {label}
  </span>
);

const Line: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
    <span style={{ color: BRAND.textMuted }}>{label}</span>
    <span className={mono ? "tabular" : "tabular"} style={{ fontWeight: 600, color: BRAND.textPrimary, fontFamily: mono ? "monospace" : undefined }}>{value}</span>
  </div>
);

const ProhRow: React.FC<{ label: string; onShow: () => void }> = ({ label, onShow }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <CloseCircleFilled style={{ color: BRAND.error, fontSize: 20 }} />
      <span style={{ fontWeight: 500, color: BRAND.textPrimary, fontSize: 15 }}>{label}</span>
    </span>
    <button onClick={onShow} style={{ background: "none", border: "none", color: BRAND.primary, fontWeight: 600, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
      Show <RightOutlined style={{ fontSize: 11 }} />
    </button>
  </div>
);
