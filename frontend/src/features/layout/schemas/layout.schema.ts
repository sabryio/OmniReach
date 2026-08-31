/**
 * Layout / App-wide Domain — Zod Schemas (Single Source of Truth)
 *
 * Covers types used across multiple features that don't belong to a single domain:
 * theming, locale, WABridge config, scheduler state, CSV parsing.
 */

import { z } from 'zod'

// ─── Theme ────────────────────────────────────────────────────────────────────

export const themeModeSchema = z.enum(['dark', 'light', 'system'])
export const themeColorSchema = z.enum(['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'])
export const languageSchema = z.enum(['ar-EG', 'en'])

export type ThemeMode = z.infer<typeof themeModeSchema>
export type ThemeColor = z.infer<typeof themeColorSchema>
export type Language = z.infer<typeof languageSchema>

// ─── WABridge Config ──────────────────────────────────────────────────────────

export const waBridgeConfigSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string().optional(),
  timeoutMs: z.number().int().positive(),
  useSimulationMode: z.boolean(),
  simulatedNetworkLatencyMs: z.number().int().nonnegative(),
  simulatedUnregisteredRate: z.number().min(0).max(1),
})

export type WABridgeConfig = z.infer<typeof waBridgeConfigSchema>

// ─── Scheduler State ──────────────────────────────────────────────────────────

export const schedulerStateSchema = z.object({
  isRunning: z.boolean(),
  isWithinTimeWindow: z.boolean(),
  timeWindowText: z.string(),
  currentLocalTimeStr: z.string(),
  nextWindowOpenTimestamp: z.number().optional(),
  activeSendingCount: z.number().int(),
  totalQueuePending: z.number().int(),
  totalQueueHeld: z.number().int(),
  strictTimeWindow: z.boolean(),
  customWindowStartHour: z.number().int(),
  customWindowEndHour: z.number().int(),
  simulatedHourOffset: z.number(),
})

export type SchedulerState = z.infer<typeof schedulerStateSchema>

// ─── CSV ──────────────────────────────────────────────────────────────────────

export const csvParseResultSchema = z.object({
  fileName: z.string(),
  headers: z.array(z.string()),
  totalRows: z.number().int(),
  phoneColumn: z.string(),
  nameColumn: z.string().optional(),
  customColumns: z.array(z.string()),
})

export type CSVParseResult = z.infer<typeof csvParseResultSchema>
