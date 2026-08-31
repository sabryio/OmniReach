/**
 * Settings Domain — Zod Schemas (Single Source of Truth)
 *
 * Mirrors Rust AppSettings + UpdateSettingsInput (camelCase serde).
 */

import { z } from 'zod'

export const appSettingsSchema = z.object({
  schedulerStartHour: z.number().int().min(0).max(23),
  schedulerEndHour: z.number().int().min(0).max(23),
  schedulerStrictTimeWindow: z.boolean(),
  wabridgeBaseUrl: z.string().min(1),
  wabridgeTimeoutMs: z.number().int().positive(),
})

export const updateSettingsInputSchema = appSettingsSchema.partial()

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type AppSettings = z.infer<typeof appSettingsSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsInputSchema>
