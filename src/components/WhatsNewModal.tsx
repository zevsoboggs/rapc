import { useEffect, useState } from "react";
import { Modal, Button } from "antd";
import {
  CreditCardOutlined,
  CarOutlined,
  DollarCircleOutlined,
  BgColorsOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { BRAND } from "../theme";

// Bump this when there is something new to announce — the modal shows once per
// version, per browser.
const VERSION = "2024.1";
const KEY = "rc-whatsnew-seen";

const ITEMS: { icon: React.ReactNode; title: string; text: string }[] = [
  {
    icon: <CreditCardOutlined />,
    title: "Physical cards",
    text: "Order plastic cards in your program's design, with production & delivery tracking.",
  },
  {
    icon: <CarOutlined />,
    title: "Deliveries",
    text: "A new section to follow shipment status and tracking numbers for your physical cards.",
  },
  {
    icon: <DollarCircleOutlined />,
    title: "USDT deposits",
    text: "Top up your settlement balance with USDT — get a pay-to address and auto-crediting.",
  },
  {
    icon: <BgColorsOutlined />,
    title: "Custom card designs",
    text: "Your programs now show branded card artwork across the portal.",
  },
  {
    icon: <LineChartOutlined />,
    title: "New dashboard",
    text: "A refreshed dashboard with balance trends and card analytics.",
  },
];

export const WhatsNewModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== VERSION) {
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(KEY, VERSION);
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      centered
      width={520}
      footer={null}
      title={null}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ background: BRAND.gradient, color: "#fff", padding: "26px 28px", borderRadius: "8px 8px 0 0" }}>
        <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.85 }}>
          What's new
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>
          RapidCard just got better
        </div>
        <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 4 }}>
          Here's what has been added recently.
        </div>
      </div>

      <div style={{ padding: "20px 28px 8px" }}>
        {ITEMS.map((it) => (
          <div key={it.title} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: `1px solid ${BRAND.borderSubtle}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: BRAND.primarySoft, color: BRAND.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {it.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>{it.title}</div>
              <div style={{ fontSize: 13, color: BRAND.textSecondary, lineHeight: 1.5 }}>{it.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 28px 24px", textAlign: "right" }}>
        <Button type="primary" size="large" onClick={close}>
          Got it
        </Button>
      </div>
    </Modal>
  );
};
