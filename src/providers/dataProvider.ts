import type { DataProvider } from "@refinedev/core";
import { api, API_URL } from "./axios";

/**
 * Light data provider. The portal is mostly action-oriented custom pages, but
 * this powers the Refine cards list which returns `{ total, items }`.
 */
export const dataProvider: DataProvider = {
  getApiUrl: () => API_URL,

  getList: async ({ resource, pagination, filters }) => {
    const current = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? 20;

    const params: Record<string, unknown> = {
      limit: pageSize,
      offset: (current - 1) * pageSize,
    };

    (filters ?? []).forEach((filter) => {
      if ("field" in filter && filter.value !== undefined && filter.value !== "") {
        params[filter.field] = filter.value;
      }
    });

    const { data } = await api.get(`/portal/${resource}`, { params });

    // Portal list endpoints return { total, items }.
    if (data && Array.isArray(data.items)) {
      return { data: data.items, total: data.total ?? data.items.length };
    }
    if (Array.isArray(data)) {
      return { data, total: data.length };
    }
    return { data: data?.data ?? [], total: data?.total ?? 0 };
  },

  getOne: async ({ resource, id }) => {
    const { data } = await api.get(`/portal/${resource}/${id}`);
    return { data };
  },

  create: async ({ resource, variables }) => {
    const { data } = await api.post(`/portal/${resource}`, variables);
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const { data } = await api.patch(`/portal/${resource}/${id}`, variables);
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const { data } = await api.delete(`/portal/${resource}/${id}`);
    return { data };
  },

  custom: async ({ url, method, payload, query }) => {
    const { data } = await api.request({
      url,
      method: method ?? "get",
      data: payload,
      params: query,
    });
    return { data };
  },
};
