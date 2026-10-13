import { apiFetch } from "./client";

export type LogEntry = {
  ts: string;
  level: string;
  message: string;
};

export type LogPage = {
  items: LogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type LogsQuery = {
  search?: string;
  level?: string;
  from?: string;
  to?: string;
  pageSize?: number;
  cursor?: string;
};

export async function fetchServerLogs(query: LogsQuery): Promise<LogPage> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.level) params.set("level", query.level);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.cursor) params.set("cursor", query.cursor);

  const qs = params.toString();
  return apiFetch<LogPage>(`/managment/logs${qs ? `?${qs}` : ""}`);
}
