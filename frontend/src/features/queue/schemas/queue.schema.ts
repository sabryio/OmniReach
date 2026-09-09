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

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type QueueItemStatus = z.infer<typeof queueItemStatusSchema>;
export type QueueStats = z.infer<typeof queueStatsSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogCategory = z.infer<typeof logCategorySchema>;
