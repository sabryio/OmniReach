import { config } from "@/lib/config";
import {
  queueSchema,
  queueStatsSchema,
  queueItemSchema,
  logsSchema,
  type QueueItem,
  type QueueStats,
  type LogEntry,
} from "../schemas/queue.schema";

// ─── Queue Queries ────────────────────────────────────────────────────────────

export async function getQueue(campaignId?: string): Promise<QueueItem[]> {
  const url = campaignId
    ? `${config.apiBaseUrl}/api/queue?campaign_id=${campaignId}`
    : `${config.apiBaseUrl}/api/queue`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch queue: ${response.statusText}`);

  const data = await response.json();
  return queueSchema.parse(data);
}

export async function getQueueStats(): Promise<QueueStats> {
  const response = await fetch(`${config.apiBaseUrl}/api/queue/stats`, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch queue stats: ${response.statusText}`);
  return queueStatsSchema.parse(await response.json());
}

// ─── Queue Mutations ──────────────────────────────────────────────────────────

export async function cancelQueueItem(id: string): Promise<QueueItem> {
  const response = await fetch(`${config.apiBaseUrl}/api/queue/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to cancel queue item: ${response.statusText}`);
  return queueItemSchema.parse(await response.json());
}

// ─── Log Queries ──────────────────────────────────────────────────────────────

export async function getLogs(): Promise<LogEntry[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/logs`, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  return logsSchema.parse(await response.json());
}

// ─── Log Mutations ────────────────────────────────────────────────────────────

export async function clearLogs(): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/logs`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to clear logs: ${response.statusText}`);
}
