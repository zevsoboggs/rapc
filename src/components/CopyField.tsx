import React from "react";
import { App as AntdApp, Button, Tooltip } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { BRAND } from "../theme";

export async function copyText(value: string, label: string, ok: (m: string) => void) {
  try {
    await navigator.clipboard.writeText(value);
    ok(`${label} copied`);
  } catch {
    ok(`Could not copy ${label}`);
  }
}

/** A single field with a value and an inline copy button — the mockup "requisite" row. */
export const CopyField: React.FC<{
  value?: string | null;
  mono?: boolean;
  large?: boolean;
  placeholder?: string;
  label?: string;
}> = ({ value, mono, large, placeholder = "—", label }) => {
  const { message } = AntdApp.useApp();
  const text = value || "";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        background: BRAND.appBg,
        border: `1px solid ${BRAND.borderSubtle}`,
        borderRadius: 12,
        padding: large ? "14px 16px" : "11px 14px",
      }}
    >
      <span
        className={mono ? "tabular" : undefined}
        style={{
          fontFamily: mono ? "'Inter', monospace" : undefined,
          fontSize: large ? 17 : 15,
          fontWeight: 500,
          letterSpacing: mono ? "0.04em" : undefined,
          color: text ? BRAND.textPrimary : BRAND.textMuted,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {text || placeholder}
      </span>
      {text && (
        <Tooltip title="Copy">
          <Button
            type="text"
            size="small"
            shape="circle"
            icon={<CopyOutlined style={{ color: BRAND.textMuted }} />}
            onClick={() => copyText(text, label || "Value", (m) => message.success(m))}
          />
        </Tooltip>
      )}
    </div>
  );
};

/** Label + value + copy — the "Additional information" rows. */
export const CopyInfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  const { message } = AntdApp.useApp();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 0",
        borderBottom: `1px solid ${BRAND.borderSubtle}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: BRAND.textMuted, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 15, color: value ? BRAND.textPrimary : BRAND.textMuted, wordBreak: "break-word" }}>
          {value || "—"}
        </div>
      </div>
      {value && (
        <Button
          type="text"
          size="small"
          shape="circle"
          icon={<CopyOutlined style={{ color: BRAND.textMuted }} />}
          onClick={() => copyText(value, label, (m) => message.success(m))}
        />
      )}
    </div>
  );
};
