import { useGetIdentity, useLogout } from "@refinedev/core";
import { Layout, Dropdown, Avatar, Space, Button, Grid } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import { BRAND } from "../theme";

interface Identity {
  id?: string;
  name?: string;
  email?: string;
}

interface AppHeaderProps {
  collapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  setCollapsed,
}) => {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const screens = Grid.useBreakpoint();

  const name = identity?.name || "Client";
  const email = identity?.email;

  return (
    <Layout.Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        height: 64,
        padding: "0 20px 0 12px",
        background: "#fff",
        borderBottom: `1px solid ${BRAND.borderSubtle}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Space size={4}>
        {setCollapsed && (
          <Button
            type="text"
            aria-label="Toggle menu"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        )}
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: BRAND.textPrimary,
            letterSpacing: "-0.01em",
          }}
        >
          {screens.sm ? name : "Billing Portal"}
        </span>
      </Space>

      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "identity",
              label: (
                <div style={{ padding: "4px 2px", minWidth: 180 }}>
                  <div style={{ fontWeight: 600, color: BRAND.textPrimary }}>
                    {name}
                  </div>
                  {email && (
                    <div style={{ fontSize: 12, color: BRAND.textMuted }}>
                      {email}
                    </div>
                  )}
                </div>
              ),
              disabled: true,
            },
            { type: "divider" },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              danger: true,
              label: "Sign out",
              onClick: () => logout(),
            },
          ],
        }}
      >
        <Space
          style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 10 }}
          className="rc-elevate"
        >
          <Avatar
            size={34}
            style={{ background: BRAND.primarySoft, color: BRAND.primary }}
            icon={<UserOutlined />}
          />
          {screens.md && (
            <span style={{ fontWeight: 500, color: BRAND.textSecondary }}>
              {name}
            </span>
          )}
          <DownOutlined style={{ fontSize: 10, color: BRAND.textMuted }} />
        </Space>
      </Dropdown>
    </Layout.Header>
  );
};
