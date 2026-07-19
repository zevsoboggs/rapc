import { Refine, Authenticated } from "@refinedev/core";
import {
  ErrorComponent,
  useNotificationProvider,
} from "@refinedev/antd";
import routerBindings, {
  CatchAllNavigate,
  NavigateToResource,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { ConfigProvider, App as AntdApp } from "antd";
import {
  DashboardOutlined,
  CreditCardOutlined,
  AppstoreOutlined,
  AccountBookOutlined,
  ApiOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";

import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";
import { AppShell } from "./components/AppShell";
import { theme } from "./theme";

import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { CardsListPage } from "./pages/cards/list";
import { CardShowPage } from "./pages/cards/show";
import { ProgramsPage } from "./pages/programs";
import { DeliveriesPage } from "./pages/deliveries";
import { BillingPage } from "./pages/billing";
import { SupportPage } from "./pages/support";
import { DepositsPage } from "./pages/deposits";
import { ApiKeysPage } from "./pages/api-keys";

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <AntdApp>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider}
            routerProvider={routerBindings}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Dashboard", icon: <DashboardOutlined /> },
              },
              {
                name: "cards",
                list: "/cards",
                show: "/cards/:id",
                meta: { label: "Cards", icon: <CreditCardOutlined /> },
              },
              {
                name: "programs",
                list: "/programs",
                meta: { label: "Programs", icon: <AppstoreOutlined /> },
              },
              {
                name: "deposits",
                list: "/deposits",
                meta: { label: "Add funds", icon: <DollarCircleOutlined /> },
              },
              {
                name: "billing",
                list: "/billing",
                meta: { label: "Billing", icon: <AccountBookOutlined /> },
              },
              {
                name: "api-keys",
                list: "/settings/api-keys",
                meta: { label: "API keys", icon: <ApiOutlined /> },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              disableTelemetry: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <AppShell>
                      <Outlet />
                    </AppShell>
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/cards">
                  <Route index element={<CardsListPage />} />
                  <Route path=":id" element={<CardShowPage />} />
                </Route>
                <Route path="/programs" element={<ProgramsPage />} />
                <Route path="/deliveries" element={<DeliveriesPage />} />
                <Route path="/deposits" element={<DepositsPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/settings/api-keys" element={<ApiKeysPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>

              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
              </Route>
            </Routes>

            <UnsavedChangesNotifier />
            <DocumentTitleHandler
              handler={({ resource, action }: any) => {
                const base = "RapidCard.pro — Billing";
                const label = resource?.meta?.label || resource?.name;
                return label && action ? `${label} · ${base}` : base;
              }}
            />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
