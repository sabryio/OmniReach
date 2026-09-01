/**
 * Dashboard Domain — Zod Schemas (Single Source of Truth)
 */

import { z } from "zod";

export const sessionRateQuotaSchema = z.object({
  sessionId: z.string(),
  sessionName: z.string(),
  hourlyUsed: z.number().int(),
  hourlyLimit: z.number().int(),
  hourlyRemaining: z.number().int(),
  dailyUsed: z.number().int(),
  dailyLimit: z.number().int(),
  dailyRemaining: z.number().int(),
  isHourlyCapped: z.boolean(),
  isDailyCapped: z.boolean(),
  canSend: z.boolean(),
  nextHourlySlotMs: z.number().nullable().optional(),
  nextDailySlotMs: z.number().nullable().optional(),
  reason: z.string().nullable().optional(),
});

export type SessionRateQuota = z.infer<typeof sessionRateQuotaSchema>;
