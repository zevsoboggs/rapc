import { useCallback, useEffect, useState } from "react";
import { Button, Input, Alert, Steps, Tag, Modal, App as AntdApp } from "antd";
import {
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CopyOutlined,
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../providers/axios";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { BRAND } from "../theme";

interface Status {
  enabled: boolean;
  backupCodesRemaining: number;
}

export const SecurityPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Status>("/portal/2fa")
      .then((res) => setStatus(res.data))
      .catch(() => message.error("Failed to load security settings."))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => { load(); }, [load]);

  const startSetup = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ secret: string; otpauthUrl: string }>("/portal/2fa/setup");
      setSetup(data);
      setCode("");
    } catch {
      message.error("Failed to start setup.");
    } finally {
      setBusy(false);
    }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ enabled: boolean; backupCodes: string[] }>("/portal/2fa/enable", { code });
      setBackupCodes(data.backupCodes);
      setSetup(null);
      setCode("");
      message.success("Two-factor authentication enabled.");
      load();
    } catch (e) {
      message.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await api.post("/portal/2fa/disable", { code: disableCode });
      message.success("Two-factor authentication disabled.");
      setDisableOpen(false);
      setDisableCode("");
      load();
    } catch (e) {
      message.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => message.success(`${label} copied.`),
      () => message.error(`Could not copy ${label}.`),
    );
  };

  return (
    <div>
      <PageHeader title="Security" subtitle="Protect your account with two-factor authentication." />

      <div style={{ maxWidth: 620 }}>
        <SectionCard
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SafetyCertificateOutlined style={{ color: BRAND.primary }} /> Two-factor authentication
              {status?.enabled && <Tag color="success" style={{ marginInlineStart: 4 }}>Enabled</Tag>}
            </span>
          }
        >
          {loading ? (
            <div className="rc-skel" style={{ height: 80, borderRadius: 12 }} />
          ) : status?.enabled ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: BRAND.success, fontWeight: 600 }}>
                <CheckCircleFilled /> Your account is protected with an authenticator app.
              </div>
              <p style={{ color: BRAND.textSecondary, marginTop: 10 }}>
                You'll be asked for a 6-digit code each time you sign in. Backup codes remaining:{" "}
                <b>{status.backupCodesRemaining}</b>.
              </p>
              <Button danger onClick={() => setDisableOpen(true)} style={{ height: 44, borderRadius: 12 }}>
                Disable two-factor
              </Button>
            </div>
          ) : !setup ? (
            <div>
              <p style={{ color: BRAND.textSecondary, marginTop: 0 }}>
                Add a second layer of security. You'll use an authenticator app (Google Authenticator,
                1Password, Authy) to generate a code at each sign-in.
              </p>
              <Button type="primary" loading={busy} onClick={startSetup} style={{ height: 44, borderRadius: 12 }}>
                Enable two-factor
              </Button>
            </div>
          ) : (
            <div>
              <Steps
                direction="vertical"
                size="small"
                current={1}
                items={[
                  {
                    title: "Scan the QR code",
                    description: (
                      <div style={{ padding: "12px 0" }}>
                        <div style={{ display: "inline-block", padding: 14, background: "#fff", border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 16 }}>
                          <QRCodeSVG value={setup.otpauthUrl} size={168} level="M" marginSize={0} fgColor="#0F172A" />
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12.5, color: BRAND.textMuted, marginBottom: 4 }}>Or enter this key manually</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 360 }}>
                            <Input readOnly value={setup.secret} style={{ fontFamily: "monospace", letterSpacing: "0.1em" }} />
                            <Button icon={<CopyOutlined />} onClick={() => copy(setup.secret, "Setup key")} />
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Enter the 6-digit code",
                    description: (
                      <div style={{ padding: "12px 0", maxWidth: 360 }}>
                        <Input
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          inputMode="numeric"
                          style={{ letterSpacing: "0.3em", fontWeight: 600 }}
                        />
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                          <Button type="primary" loading={busy} disabled={code.length !== 6} onClick={enable} style={{ borderRadius: 10 }}>
                            Verify & enable
                          </Button>
                          <Button onClick={() => setSetup(null)} style={{ borderRadius: 10 }}>Cancel</Button>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Backup codes reveal */}
      <Modal
        title="Save your backup codes"
        open={!!backupCodes}
        onCancel={() => setBackupCodes(null)}
        footer={[<Button key="ok" type="primary" onClick={() => setBackupCodes(null)}>I saved them</Button>]}
      >
        <Alert
          type="warning"
          showIcon
          message="Store these somewhere safe"
          description="Each code can be used once to sign in if you lose access to your authenticator. They won't be shown again."
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {backupCodes?.map((c) => (
            <div key={c} style={{ fontFamily: "monospace", fontSize: 15, letterSpacing: "0.08em", background: BRAND.appBg, border: `1px solid ${BRAND.borderSubtle}`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>{c}</div>
          ))}
        </div>
        <Button block icon={<CopyOutlined />} style={{ marginTop: 14 }} onClick={() => copy((backupCodes || []).join("\n"), "Backup codes")}>Copy all</Button>
      </Modal>

      {/* Disable confirm */}
      <Modal
        title="Disable two-factor authentication"
        open={disableOpen}
        onCancel={() => setDisableOpen(false)}
        onOk={disable}
        okText="Disable"
        okButtonProps={{ danger: true, loading: busy, disabled: disableCode.length < 6 }}
      >
        <p style={{ color: BRAND.textSecondary }}>Enter a current authentication code (or a backup code) to confirm.</p>
        <Input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="123456" style={{ letterSpacing: "0.2em", fontWeight: 600 }} />
      </Modal>
    </div>
  );
};
