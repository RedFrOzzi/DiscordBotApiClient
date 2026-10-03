export type JwtPayload = {
  sub?: string;
  role?: string | string[];
  exp?: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
};

const ROLE_KEYS = [
  "role",
  "roles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getRoles(payload: JwtPayload | null): string[] {
  if (!payload) return [];
  for (const key of ROLE_KEYS) {
    const v = payload[key];
    if (typeof v === "string") return [v];
    if (Array.isArray(v))
      return v.filter((x): x is string => typeof x === "string");
  }
  return [];
}
