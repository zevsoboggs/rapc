import { useState } from "react";
import { Button, Form, Input, Grid, Alert } from "antd";
import {
  MailOutlined,
  LockOutlined,
  CheckCircleFilled,
  SafetyOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Brand } from "../components/Brand";
import { api, TOKEN_KEY } from "../providers/axios";
import { BRAND, CARD_SHADOW } from "../theme";

const { useBreakpoint } = Grid;

interface LoginValues {
  email: string;
  password: string;
}

const FEATURES = [
  "Issue virtual & physical cards in seconds",
  "Fund your balance instantly with USDT",
  "Full programmatic access via API keys",
];

function apiError(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export const LoginPage: React.FC = () => {
  const screens = useBreakpoint();
  const [stage, setStage] = useState<"creds" | "2fa">("creds");
  const [challenge, setChallenge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finish = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    window.location.href = "/";
  };

  const submitCreds = async (values: LoginValues) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/client/login", values);
      if (data?.twoFactorRequired && data?.challenge) {
        setChallenge(data.challenge);
        setStage("2fa");
      } else if (data?.token) {
        finish(data.token);
      } else {
        setError("Invalid response from server");
      }
    } catch (e) {
      setError(apiError(e, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  const submit2fa = async (values: { code: string }) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/client/2fa", { challenge, code: values.code });
      if (data?.token) finish(data.token);
      else setError("Invalid response from server");
    } catch (e) {
      setError(apiError(e, "Invalid authentication code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#fff" }}>
      {/* LEFT brand panel (hidden < md) */}
      {screens.md && (
        <div
          style={{
            flex: "1 1 50%",
            position: "relative",
            background: BRAND.gradient,
            color: "#fff",
            padding: "56px 56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -120,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.28))",
            }}
          >
            <Brand onDark size={48} />
          </div>

          <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
            <h1
              style={{
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              The modern card platform for growing businesses.
            </h1>
            <p
              style={{
                marginTop: 16,
                fontSize: 16,
                color: "rgba(255,255,255,.82)",
                maxWidth: 420,
              }}
            >
              Manage programs, issue cards, and settle balances — all from one
              premium billing portal.
            </p>

            <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
              {FEATURES.map((f) => (
                <div
                  key={f}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <CheckCircleFilled
                    style={{ color: "rgba(255,255,255,.92)", fontSize: 18 }}
                  />
                  <span style={{ fontSize: 15, color: "rgba(255,255,255,.92)" }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: 13,
              color: "rgba(255,255,255,.6)",
            }}
          >
            © {new Date().getFullYear()} RapidCard.pro — Client Billing Portal
          </div>
        </div>
      )}

      {/* RIGHT form area */}
      <div
        style={{
          flex: "1 1 50%",
          background: BRAND.appBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: 400,
            maxWidth: "100%",
            background: "#fff",
            border: `1px solid ${BRAND.borderSubtle}`,
            boxShadow: CARD_SHADOW,
            borderRadius: 16,
            padding: 36,
          }}
        >
          {!screens.md && (
            <div style={{ marginBottom: 24 }}>
              <Brand />
            </div>
          )}
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: BRAND.textPrimary,
            }}
          >
            {stage === "creds" ? "Sign in" : "Two-factor authentication"}
          </h2>
          <p style={{ margin: "6px 0 24px", color: BRAND.textSecondary }}>
            {stage === "creds"
              ? "Welcome back. Please enter your details."
              : "Enter the 6-digit code from your authenticator app."}
          </p>

          {error && (
            <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
          )}

          {stage === "creds" ? (
            <Form<LoginValues>
              layout="vertical"
              onFinish={submitCreds}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: BRAND.textMuted }} />}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Please enter your password" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: BRAND.textMuted }} />}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 46, fontWeight: 600 }}>
                  Sign in
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              layout="vertical"
              onFinish={submit2fa}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                label="Authentication code"
                name="code"
                rules={[
                  { required: true, message: "Enter your 6-digit code" },
                  { pattern: /^\d{6}$/, message: "Code is 6 digits" },
                ]}
              >
                <Input
                  prefix={<SafetyOutlined style={{ color: BRAND.textMuted }} />}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  autoComplete="one-time-code"
                  style={{ letterSpacing: "0.3em", fontWeight: 600 }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 8, marginTop: 8 }}>
                <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 46, fontWeight: 600 }}>
                  Verify & sign in
                </Button>
              </Form.Item>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => { setStage("creds"); setError(""); }} style={{ color: BRAND.textSecondary }}>
                Back to sign in
              </Button>
              <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12.5, color: BRAND.textMuted }}>
                Lost your device? Enter one of your backup codes instead.
              </p>
            </Form>
          )}

          {stage === "creds" && (
            <p
              style={{
                textAlign: "center",
                marginTop: 22,
                marginBottom: 0,
                fontSize: 12.5,
                color: BRAND.textMuted,
              }}
            >
              Secure access for RapidCard.pro client tenants.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
