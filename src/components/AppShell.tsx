import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { Layout, Dropdown, Avatar, Button, Tooltip, Grid } from "antd";
import {
  DashboardOutlined,
  CreditCardOutlined,
  AppstoreOutlined,
  AccountBookOutlined,
  ApiOutlined,
  DollarCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  PlusOutlined,
  CarOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Brand } from "./Brand";
import { WhatsNewModal } from "./WhatsNewModal";
import { BRAND } from "../theme";

interface Identity {
  id?: string;
  name?: string;
  email?: string;
}

const NAV: {
  group: string;
  items: { to: string; label: string; icon: React.ReactNode; end?: boolean }[];
}[] = [
  { group: "Overview", items: [{ to: "/", label: "Dashboard", icon: <DashboardOutlined />, end: true }] },
  {
    group: "Cards",
    items: [
      { to: "/cards", label: "Cards", icon: <CreditCardOutlined /> },
      { to: "/programs", label: "Programs", icon: <AppstoreOutlined /> },
      { to: "/deliveries", label: "Deliveries", icon: <CarOutlined /> },
    ],
  },
  {
    group: "Money",
    items: [
      { to: "/deposits", label: "Add funds", icon: <DollarCircleOutlined /> },
      { to: "/billing", label: "Billing", icon: <AccountBookOutlined /> },
    ],
  },
  {
    group: "Developer",
    items: [
      { to: "/settings/api-keys", label: "API keys", icon: <ApiOutlined /> },
      { to: "/support", label: "Support", icon: <MessageOutlined /> },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/cards": "Cards",
  "/programs": "Card programs",
  "/deliveries": "Deliveries",
  "/deposits": "Add funds",
  "/billing": "Billing & ledger",
  "/settings/api-keys": "API keys",
  "/support": "Support",
};

const DOCS_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/docs`;

const NavItem: React.FC<{
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  collapsed?: boolean;
}> = ({ to, label, icon, end, collapsed }) => {
  const item = (
    <NavLink to={to} end={end} className={({ isActive }) => `rc-nav-item${isActive ? " active" : ""}`}
      style={collapsed ? { justifyContent: "center", padding: 0, margin: "3px 12px" } : undefined}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
  return collapsed ? (
    <Tooltip title={label} placement="right">{item}</Tooltip>
  ) : (
    item
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  useEffect(() => {
    if (!screens.lg && !collapsed) setCollapsed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens.lg]);

  const name = identity?.name || "Client";
  const email = identity?.email;
  const title = TITLES[location.pathname] || "";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <WhatsNewModal />
      <Layout.Sider
        theme="light"
        width={258}
        collapsedWidth={78}
        collapsed={collapsed}
        style={{
          background: "#fff",
          borderRight: `1px solid ${BRAND.borderSubtle}`,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: collapsed ? "18px 0" : "20px 18px 10px", display: "flex", justifyContent: collapsed ? "center" : "flex-start" }}>
            <Link to="/"><Brand collapsed={collapsed} /></Link>
          </div>

          <div style={{ flex: 1, overflow: "auto", paddingTop: 6, paddingBottom: 12 }}>
            {NAV.flatMap((sec) => sec.items).map((it) => (
              <NavItem key={it.to} {...it} collapsed={collapsed} />
            ))}
            <Tooltip title={collapsed ? "API docs" : ""} placement="right">
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="rc-nav-item"
                style={collapsed ? { justifyContent: "center", padding: 0, margin: "3px 12px" } : undefined}
              >
                <BookOutlined />
                {!collapsed && <span>API docs</span>}
              </a>
            </Tooltip>
          </div>

          {/* Sign out */}
          <div style={{ borderTop: `1px solid ${BRAND.borderSubtle}`, padding: "8px 0" }}>
            <Tooltip title={collapsed ? "Sign out" : ""} placement="right">
              <div
                className="rc-nav-item rc-signout"
                onClick={() => logout()}
                style={collapsed ? { justifyContent: "center", padding: 0, margin: "3px 12px" } : undefined}
              >
                <LogoutOutlined />
                {!collapsed && <span>Sign out</span>}
              </div>
            </Tooltip>
          </div>
        </div>
      </Layout.Sider>

      <Layout>
        <Layout.Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            height: 64,
            padding: "0 20px 0 10px",
            background: "#fff",
            borderBottom: `1px solid ${BRAND.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Button type="text" aria-label="Toggle menu"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} />
            <span style={{ fontSize: 16, fontWeight: 600, color: BRAND.textPrimary, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {title}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {screens.sm && (
              <Link to="/cards">
                <Button type="primary" icon={<PlusOutlined />}>New card</Button>
              </Link>
            )}
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "id",
                    disabled: true,
                    label: (
                      <div style={{ padding: "4px 2px", minWidth: 180 }}>
                        <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>{name}</div>
                        {email && <div style={{ fontSize: 12, color: BRAND.textMuted }}>{email}</div>}
                      </div>
                    ),
                  },
                  { type: "divider" },
                  { key: "logout", icon: <LogoutOutlined />, danger: true, label: "Sign out", onClick: () => logout() },
                ],
              }}
            >
              <div className="rc-userbtn" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 10 }}>
                <Avatar size={32} style={{ background: BRAND.primarySoft, color: BRAND.primary }} icon={<UserOutlined />} />
                {screens.md && <span style={{ fontWeight: 500, color: BRAND.textSecondary }}>{name}</span>}
                <DownOutlined style={{ fontSize: 10, color: BRAND.textMuted }} />
              </div>
            </Dropdown>
          </div>
        </Layout.Header>

        <Layout.Content style={{ background: BRAND.appBg }}>
          <div style={{ padding: screens.md ? 28 : 16, maxWidth: 1440, margin: "0 auto", width: "100%" }}>
            {children}
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
};
