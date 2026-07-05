import { ActionItem, ActionItemStatus, Authority, Directive, DirectiveFilters, Paginated } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiClientError(body?.message ?? "Request failed", res.status, body?.details);
  }

  return body as T;
}

function toQueryString(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  authorities: {
    list: () => request<{ success: true; data: Authority[] }>("/authorities").then((r) => r.data),
  },

  directives: {
    list: (filters: DirectiveFilters) =>
      request<Paginated<Directive> & { success: true }>(
        `/directives${toQueryString(filters)}`
      ).then((r) => ({ data: r.data, meta: r.meta })),

    getById: (id: string) =>
      request<{ success: true; data: Directive }>(`/directives/${id}`).then((r) => r.data),
  },

  actionItems: {
    list: (params: { directiveId?: string; status?: string; flaggedOnly?: boolean; page?: number; limit?: number }) =>
      request<Paginated<ActionItem> & { success: true }>(
        `/action-items${toQueryString(params)}`
      ).then((r) => ({ data: r.data, meta: r.meta })),

    updateStatus: (id: string, status: ActionItemStatus) =>
      request<{ success: true; data: ActionItem }>(`/action-items/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }).then((r) => r.data),
  },
};

export { ApiClientError };
