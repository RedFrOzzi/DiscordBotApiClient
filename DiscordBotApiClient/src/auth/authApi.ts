import { ApiError } from "../api/ApiError";
import { tokenStore } from "./tokenStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function post<T>(path: string, body?: unknown): Promise<T> {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const full = /^https?:\/\//.test(path) ? path : `${base}${p}`;
  const token = tokenStore.get();

  const res = await fetch(full, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new ApiError(res.status, await res.text());

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export const authApi = {
  createUser: (login: string, password: string) =>
    post<void>("/users/create", { login, password }),
  login: (login: string, password: string) =>
    post<string>("/users/login", { login, password }),
  refresh: () => post<string>("/users/refresh"),
  logout: () => post<void>("/users/logout"),
  createAdmin: (dto: {
    login: string;
    password: string;
    keyword: string;
    newAdminLogin: string;
  }) => post<void>("/users/create-admin", dto),
};
