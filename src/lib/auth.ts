const ACCESS_KEY = "aajhee.access";
const REFRESH_KEY = "aajhee.refresh";
const USER_KEY = "aajhee.user";
const ROLE_KEY = "aajhee.role";

export type Role = "consumer" | "business";

let userCache: unknown = null;
let userRaw: string | null = null;

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(ROLE_KEY) as Role | null) ?? null;
}

export function getUser<T = unknown>() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (raw === userRaw) return userCache as T | null;
  userRaw = raw;
  if (!raw) {
    userCache = null;
    return null;
  }
  try {
    userCache = JSON.parse(raw) as T;
    return userCache as T;
  } catch {
    userCache = null;
    return null;
  }
}

export function setSession(payload: {
  access: string;
  refresh?: string;
  user: unknown;
  role: Role;
}) {
  localStorage.setItem(ACCESS_KEY, payload.access);
  if (payload.refresh) localStorage.setItem(REFRESH_KEY, payload.refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  localStorage.setItem(ROLE_KEY, payload.role);
  userRaw = localStorage.getItem(USER_KEY);
  userCache = payload.user;
  window.dispatchEvent(new Event("aajhee-auth"));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
  userRaw = null;
  userCache = null;
  window.dispatchEvent(new Event("aajhee-auth"));
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}
