import { clearSession, getAccessToken, getRefreshToken, setAccessToken } from "./auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.aajhee.com";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function toQuery(params?: Query) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/token/refresh`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return null;
    // ROTATE_REFRESH_TOKENS blacklists the old refresh — always persist the new one.
    setAccessToken(data.access, data.refresh ?? refresh);
    return data.access;
  } catch {
    return null;
  }
}

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function api<T>(
  path: string,
  options: RequestInit & { query?: Query; auth?: boolean; _retried?: boolean } = {},
): Promise<T> {
  const { query, auth = false, headers, _retried, ...rest } = options;
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}${toQuery(query)}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.status === 401 && (auth || token) && !_retried) {
    const hadRefresh = Boolean(getRefreshToken());
    const next = await refreshOnce();
    if (next) {
      return api<T>(path, { ...options, _retried: true });
    }
    // Only wipe the session when we know auth is dead (refresh failed or missing).
    if (hadRefresh || auth) {
      clearSession();
    }
  } else if (res.status === 401 && (auth || token) && _retried) {
    clearSession();
  }

  if (!res.ok) {
    const message =
      (typeof data === "object" &&
        data &&
        "message" in data &&
        String((data as { message: string }).message)) ||
      res.statusText;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export function pageResults<T>(payload: { results?: T[] } | T[] | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.results ?? [];
}

export function pageMeta(payload: {
  count?: number;
  page?: number;
  page_size?: number;
  results?: unknown[];
} | unknown[] | null | undefined) {
  if (!payload || Array.isArray(payload)) {
    const len = Array.isArray(payload) ? payload.length : 0;
    return { count: len, page: 1, pageSize: len || 20 };
  }
  return {
    count: payload.count ?? payload.results?.length ?? 0,
    page: payload.page ?? 1,
    pageSize: payload.page_size ?? 20,
  };
}
