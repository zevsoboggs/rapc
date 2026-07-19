import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { Dropdown, Avatar, Button, Badge, Tooltip, Grid, App as AntdApp } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MoonOutlined,
  DollarCircleOutlined,
  CarOutlined,
  InboxOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  BookOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Brand } from "./Brand";
import { WhatsNewModal } from "./WhatsNewModal";
import { BRAND } from "../theme";

interface Identity {
  id?: string;
  name?: string;
  email?: string;
}

// Primary top-nav links.
const NAV = [
  { to: "/", label: "Overview", end: true },
  { to: "/cards", label: "My cards" },
  { to: "/programs", label: "Available cards" },
  { to: "/billing", label: "Transactions" },
];

// Secondary destinations (user dropdown).
const MORE: { to: string; label: string; icon: React.ReactNode }[] = [
  { to: "/deposits", label: "Add funds", icon: <DollarCircleOutlined /> },
  { to: "/deliveries", label: "Deliveries", icon: <CarOutlined /> },
  { to: "/batch-orders", label: "Card batches", icon: <InboxOutlined /> },
  { to: "/settings/api-keys", label: "API keys", icon: <ApiOutlined /> },
  { to: "/settings/security", label: "Security", icon: <SafetyCertificateOutlined /> },
  { to: "/webhooks", label: "Webhooks", icon: <ThunderboltOutlined /> },
  { to: "/support", label: "Support", icon: <MessageOutlined /> },
];

const DOCS_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/docs`;

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const screens = Grid.useBreakpoint();
  const { message } = AntdApp.useApp();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  const name = identity?.name || "Client";
  const email = identity?.email;
  const wide = screens.lg;

  const userMenu = {
    items: [
      {
        key: "id",
        disabled: true,
        label: (
          <div style={{ padding: "4px 2px", minWidth: 200 }}>
            <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>{name}</div>
            {email && <div style={{ fontSize: 12, color: BRAND.textMuted }}>{email}</div>}
          </div>
        ),
      },
      { type: "divider" as const },
      ...(!wide
        ? NAV.map((n) => ({ key: n.to, label: <Link to={n.to}>{n.label}</Link> }))
        : []),
      ...(!wide ? [{ type: "divider" as const }] : []),
      ...MORE.map((m) => ({
        key: m.to,
        icon: m.icon,
        label: <Link to={m.to}>{m.label}</Link>,
      })),
      {
        key: "docs",
        icon: <BookOutlined />,
        label: (
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            API docs
          </a>
        ),
      },
      { type: "divider" as const },
      { key: "logout", icon: <LogoutOutlined />, danger: true, label: "Sign out", onClick: () => logout() },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.appBg }}>
      <WhatsNewModal />

      {/* Top navbar */}
      <div style={{ padding: "16px 24px 0", maxWidth: 1560, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            background: "#fff",
            border: `1px solid ${BRAND.borderSubtle}`,
            borderRadius: 18,
            boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 4px 14px rgba(16,24,40,.05)",
            padding: "10px 18px",
            height: 68,
          }}
        >
          {/* Left: logo + nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center" }}>
              <Brand />
            </Link>
            {wide && (
              <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 18 }}>
                {NAV.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) => `rc-topnav-link${isActive ? " active" : ""}`}
                  >
                    {n.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {wide && (
              <Link to="/support">
                <Button style={{ borderRadius: 999, height: 40, fontWeight: 500 }}>
                  Suggest an idea
                </Button>
              </Link>
            )}
            <div style={{ width: 1, height: 26, background: BRAND.borderSubtle, margin: "0 4px" }} />
            <Tooltip title="Dark mode — coming soon">
              <Button
                type="text"
                shape="circle"
                icon={<MoonOutlined style={{ fontSize: 17, color: BRAND.textSecondary }} />}
                onClick={() => message.info("Dark mode is coming soon.")}
              />
            </Tooltip>
            <Tooltip title="Notifications">
              <Badge dot color={BRAND.primary} offset={[-4, 4]}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 17, color: BRAND.textSecondary }} />}
                  onClick={() => message.info("No new notifications.")}
                />
              </Badge>
            </Tooltip>
            <Dropdown trigger={["click"]} menu={userMenu} placement="bottomRight">
              <Button
                type="text"
                shape="circle"
                icon={
                  wide ? (
                    <Avatar size={34} style={{ background: BRAND.primarySoft, color: BRAND.primary }} icon={<UserOutlined />} />
                  ) : (
                    <MenuOutlined />
                  )
                }
                style={{ width: 40, height: 40 }}
              />
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screens.md ? "20px 24px 48px" : "16px 14px 40px", maxWidth: 1560, margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </div>
  );
};
