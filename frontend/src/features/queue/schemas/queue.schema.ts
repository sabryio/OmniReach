/**
 * Queue & Logs Domain — Zod Schemas (Single Source of Truth)
 */

import { z } from "zod";

export const queueItemStatusSchema = z.enum([
  "pending",
  "verifying",
  "sending",
  "sent",
  "skipped_unregistered",
  "failed",
  "held_rate_limit",
  "held_time_window",
  "cancelled",
]);

export const queueItemSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  campaignTitle: z.string(),
  contactId: z.string().uuid(),
  phone: z.string(),
  recipientName: z.string().nullable(),
  renderedText: z.string(),
  imageUrl: z.string().nullable(),
  status: queueItemStatusSchema,
  assignedSessionId: z.string().uuid().nullable(),
  attempts: z.number().int(),
  lastError: z.string().nullable(),
  sentAt: z.string().datetime().nullable(),
  scheduledFor: z.string().datetime().nullable(),
  rateLimitHoldUntil: z.string().datetime().nullable(),
  timeWindowHoldUntil: z.string().datetime().nullable(),
  responsePayload: z.string().nullable(),
});

export const queueSchema = z.array(queueItemSchema);

export const queueStatsSchema = z.object({
  pending: z.number().int(),
  sending: z.number().int(),
  sent: z.number().int(),
  failed: z.number().int(),
  held: z.number().int(),
});

export const logLevelSchema = z.enum(["info", "warn", "error", "success"]);

export const logCategorySchema = z.enum([
  "verification",
  "send",
  "rate_limit",
  "scheduler",
  "session",
  "system",
]);

export const logEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  level: logLevelSchema,
  category: logCategorySchema,
  message: z.string(),
  details: z.record(z.string(), z.unknown()).nullable(),
});

export const logsSchema = z.array(logEntrySchema);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type QueueItemStatus = z.infer<typeof queueItemStatusSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
export type QueueStats = z.infer<typeof queueStatsSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogCategory = z.infer<typeof logCategorySchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
