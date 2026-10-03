import { tokenStore } from "../auth/tokenStore";
import { authApi } from "../auth/authApi";
import { ApiError } from "./ApiError";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

let refreshing: Promise<string> | null = null;

async function rawFetch(path: string, init: RequestInit, token: string | null) {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const full = /^https?:\/\//.test(path) ? path : `${base}${p}`;

  const isFormData = init.body instanceof FormData;
  return fetch(full, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

async function refreshOnce(): Promise<string> {
  if (!refreshing) {
    refreshing = authApi.refresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let res = await rawFetch(path, init, tokenStore.get());

  // Access token expired → try refresh once, then replay
  if (res.status === 401) {
    try {
      const newToken = await refreshOnce();
      tokenStore.set(newToken);
      res = await rawFetch(path, init, newToken);
    } catch {
      tokenStore.clear();
      throw new ApiError(401, "Unauthorized");
    }
  }

  if (!res.ok) throw new ApiError(res.status, await res.text());
  if (!res.ok) throw new ApiError(res.status, await res.text());

  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  let res = await rawFetch(path, {}, tokenStore.get());

  if (res.status === 401) {
    try {
      const newToken = await refreshOnce();
      tokenStore.set(newToken);
      res = await rawFetch(path, {}, newToken);
    } catch {
      tokenStore.clear();
      throw new ApiError(401, "Unauthorized");
    }
  }

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.blob();
}
