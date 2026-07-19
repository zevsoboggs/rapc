import type { AuthProvider } from "@refinedev/core";
import { api, TOKEN_KEY } from "./axios";
import type { Me } from "../types";

const USER_KEY = "rapidcard-billing-user";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const { data } = await api.post("/auth/client/login", { email, password });
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return { success: true, redirectTo: "/" };
      }
      return {
        success: false,
        error: { name: "Login failed", message: "Invalid response from server" },
      };
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid email or password";
      return {
        success: false,
        error: { name: "Login failed", message },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
      logout: true,
    };
  },

  onError: async (error) => {
    if (error?.response?.status === 401 || error?.statusCode === 401) {
      return { logout: true, redirectTo: "/login", error };
    }
    return {};
  },

  getIdentity: async () => {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw) as Me;
        return {
          id: user.id,
          name: user.companyName || user.email,
          email: user.email,
        };
      } catch {
        return null;
      }
    }
    try {
      const { data } = await api.get<Me>("/portal/me");
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return { id: data.id, name: data.companyName || data.email, email: data.email };
    } catch {
      return null;
    }
  },

  getPermissions: async () => null,
};
