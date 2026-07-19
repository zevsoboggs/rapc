import { useCallback, useEffect, useMemo, useState } from "react";
import { Input, Select, Button, Segmented, Empty, App as AntdApp } from "antd";
import {
  SearchOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  ExportOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  CloseOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Drawer, Tooltip } from "antd";
import { api } from "../providers/axios";
import type { LedgerEntry } from "../types";
import { formatMoney } from "../utils/format";
import { copyText } from "../components/CopyField";
import { BRAND, CARD_SHADOW } from "../theme";

const cardBox: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${BRAND.borderSubtle}`,
  boxShadow: CARD_SHADOW,
  borderRadius: 18,
};

const LEDGER_LABEL: Record<string, string> = {
  DEPOSIT: "Balance deposit",
  ADJUSTMENT: "Adjustment",
  ISSUANCE_FEE: "Card issuance fee",
  CARD_LOAD: "Card top-up",
  CARD_UNLOAD: "Card withdrawal",
  TOPUP_FEE: "Top-up fee",
  WITHDRAW_FEE: "Withdrawal fee",
  MONTHLY_FEE: "Monthly fee",
  REFUND: "Refund",
};

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return {
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
    date: d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }),
    full: d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
};

const label = (e: LedgerEntry) => e.description || LEDGER_LABEL[e.type] || e.type;
const isIssue = (e: LedgerEntry) => e.type === "ISSUANCE_FEE" || /issu/i.test(e.description || "");

export const BillingPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState<"cards" | "account">("cards");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [dirFilter, setDirFilter] = useState<"all" | "in" | "out">("all");
  const [period, setPeriod] = useState<"all" | "month" | "7" | "30">("all");
  const [activeTx, setActiveTx] = useState<LedgerEntry | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ items: LedgerEntry[] }>("/portal/ledger", { params: { limit: 500 } })
      .then((res) => setEntries(res.data.items ?? []))
      .catch(() => message.error("Failed to load transactions."))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => { load(); }, [load]);

  const types = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.type));
    return Array.from(set);
  }, [entries]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return entries.filter((e) => {
      if (scope === "cards" && !e.cardId) return false;
      if (scope === "account" && e.cardId) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      const amt = parseFloat(e.amount) || 0;
      if (dirFilter === "in" && amt < 0) return false;
      if (dirFilter === "out" && amt >= 0) return false;
      if (period !== "all") {
        const age = now - new Date(e.createdAt).getTime();
        const days = period === "month" ? 31 : Number(period);
        if (age > days * 86400000) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!label(e).toLowerCase().includes(q) && !(e.reference || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, scope, typeFilter, dirFilter, period, search]);

  const downloadCsv = () => {
    const rows = [["Date", "Description", "Type", "Amount", "Currency", "Reference"]];
    filtered.forEach((e) => rows.push([
      new Date(e.createdAt).toISOString(),
      label(e).replace(/"/g, "'"),
      e.type,
      e.amount,
      e.currency,
      e.reference || "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${scope}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Report downloaded.");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", color: BRAND.textPrimary }}>Transactions</h1>
        <Segmented
          size="large"
          value={scope}
          onChange={(v) => setScope(v as "cards" | "account")}
          options={[{ label: "Cards", value: "cards" }, { label: "Account", value: "account" }]}
        />
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left: list */}
        <div style={{ flex: "1 1 560px", minWidth: 300 }}>
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined style={{ color: BRAND.textMuted }} />}
            placeholder="Search by card or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: 14, marginBottom: 16, background: "#fff" }}
          />

          <div style={{ ...cardBox, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 120px", gap: 12, padding: "16px 24px", color: BRAND.textMuted, fontSize: 13, borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
              <span>Description</span><span>Time</span><span>Card</span><span style={{ textAlign: "right" }}>Amount</span>
            </div>
            {loading ? (
              <div style={{ padding: 24 }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="rc-skel" style={{ height: 40, borderRadius: 8, marginBottom: 10 }} />)}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 56 }}><Empty description="No transactions found" /></div>
            ) : (
              filtered.map((e) => {
                const amt = parseFloat(e.amount) || 0;
                const positive = amt >= 0;
                const tm = timeOf(e.createdAt);
                const issue = isIssue(e);
                return (
                  <div key={e.id} onClick={() => setActiveTx(e)} style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 120px", gap: 12, padding: "14px 24px", borderBottom: `1px solid ${BRAND.borderSubtle}`, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: issue ? BRAND.appBg : positive ? BRAND.successSoft : BRAND.appBg, color: issue ? BRAND.textSecondary : positive ? BRAND.success : BRAND.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                        {issue ? <CreditCardOutlined /> : positive ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                      </span>
                      <span style={{ fontWeight: 500, color: BRAND.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label(e)}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <div className="tabular" style={{ color: BRAND.textPrimary }}>{tm.time}</div>
                      <div style={{ color: BRAND.textMuted, fontSize: 12 }}>{tm.date}</div>
                    </div>
                    <div className="tabular" style={{ color: BRAND.textSecondary, fontSize: 13 }}>
                      {e.cardId ? <>•••• <ExportOutlined style={{ fontSize: 11, color: BRAND.primary }} /></> : "Account"}
                    </div>
                    <div className="tabular" style={{ textAlign: "right", fontWeight: 700, color: positive ? BRAND.success : BRAND.textPrimary }}>
                      {positive ? "+" : "-"}{formatMoney(Math.abs(amt))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: filters */}
        <div style={{ flex: "0 0 300px", width: 300, maxWidth: "100%" }}>
          <div style={{ ...cardBox, padding: 22 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.textPrimary, marginBottom: 18 }}>Filters</div>

            <Field label="Transaction type">
              <Select allowClear value={typeFilter} onChange={setTypeFilter} placeholder="All types" style={{ width: "100%" }}
                options={types.map((t) => ({ value: t, label: LEDGER_LABEL[t] || t }))} />
            </Field>
            <Field label="Direction">
              <Select value={dirFilter} onChange={setDirFilter} style={{ width: "100%" }}
                options={[{ value: "all", label: "All directions" }, { value: "in", label: "Incoming" }, { value: "out", label: "Outgoing" }]} />
            </Field>
            <Field label="Period">
              <Select value={period} onChange={setPeriod} style={{ width: "100%" }}
                options={[{ value: "all", label: "All time" }, { value: "month", label: "This month" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }]} />
            </Field>

            <div style={{ borderTop: `1px solid ${BRAND.borderSubtle}`, marginTop: 8, paddingTop: 18 }}>
              <div style={{ fontWeight: 700, color: BRAND.textPrimary, marginBottom: 4 }}>Download report</div>
              <div style={{ fontSize: 13, color: BRAND.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                Export the current view to keep track of your spending.
              </div>
              <Button block icon={<DownloadOutlined />} onClick={downloadCsv} style={{ height: 46, borderRadius: 12 }}>
                Download CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction details drawer */}
      <Drawer
        title="Details"
        placement="right"
        width={460}
        open={!!activeTx}
        onClose={() => setActiveTx(null)}
        closeIcon={<CloseOutlined />}
        footer={
          <Button block onClick={() => setActiveTx(null)} style={{ height: 48, borderRadius: 12, background: "#0f172a", color: "#fff", border: "none", fontWeight: 600 }}>
            Close
          </Button>
        }
      >
        {activeTx && (() => {
          const amt = parseFloat(activeTx.amount) || 0;
          const positive = amt >= 0;
          const issue = isIssue(activeTx);
          const tm = timeOf(activeTx.createdAt);
          return (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 76, height: 76, borderRadius: "50%", margin: "0 auto 16px", background: issue ? BRAND.appBg : positive ? BRAND.successSoft : BRAND.appBg, color: issue ? BRAND.textSecondary : positive ? BRAND.success : BRAND.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                  {issue ? <CreditCardOutlined /> : positive ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, color: BRAND.textPrimary }}>{label(activeTx)}</div>
                <div className="tabular" style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: positive ? BRAND.success : BRAND.textPrimary }}>
                  {positive ? "+" : "-"}{formatMoney(Math.abs(amt))}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: BRAND.successSoft, color: BRAND.success, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircleFilled /> Completed
                </div>
              </div>

              <div style={{ background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 14, padding: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Transaction ID</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="tabular" style={{ fontFamily: "monospace", fontSize: 13.5, color: BRAND.textPrimary, wordBreak: "break-all" }}>{activeTx.id}</span>
                    <Tooltip title="Copy"><Button type="text" size="small" shape="circle" icon={<CopyOutlined style={{ color: BRAND.textMuted }} />} onClick={() => copyText(activeTx.id, "Transaction ID", (m) => message.success(m))} /></Tooltip>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Balance after</div>
                  <div className="tabular" style={{ fontSize: 14, color: BRAND.textPrimary }}>{formatMoney(activeTx.balanceAfter, activeTx.currency)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Date</div>
                  <div className="tabular" style={{ fontSize: 14, color: BRAND.textPrimary }}>{tm.full}</div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, color: BRAND.textPrimary, marginBottom: 8 }}>Comment</div>
                <Input.TextArea rows={3} placeholder="Add a comment…" />
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <Button type="text" style={{ color: BRAND.primary }} onClick={() => message.success("Comment saved.")}>Save</Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 13, color: BRAND.textSecondary, fontWeight: 500, marginBottom: 7 }}>{label}</div>
    {children}
  </div>
);
