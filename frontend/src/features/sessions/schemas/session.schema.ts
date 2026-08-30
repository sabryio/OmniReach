/**
 * Sessions Domain — Zod Schemas (Single Source of Truth)
 * 
 * These schemas define the shape of Session data at runtime and compile time.
 * The backend Rust types MUST serialize to match these schemas.
 */

import { z } from 'zod'

/**
 * Session status enum — matches Rust SessionStatus
 */
export const sessionStatusSchema = z.enum([
  'connected',
  'disconnected',
  'qr_required',
  'connecting',
])

/**
 * WABridge Session — matches Rust Session type (camelCase serialization)
 */
export const sessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
  status: sessionStatusSchema,
  hourlyLimit: z.number().int().nonnegative(),
  dailyLimit: z.number().int().nonnegative(),
  hourlySentTimestamps: z.array(z.number().int()),
  dailySentTimestamps: z.array(z.number().int()),
  qrCodeData: z.string().optional(),
  lastActivityAt: z.string().datetime().optional(), // ISO 8601 from Rust DateTime<Utc>
})

/**
 * Array of sessions (for GET /api/sessions response)
 */
export const sessionsSchema = z.array(sessionSchema)

/**
 * Create session input (for POST /api/sessions request body)
 */
export const createSessionInputSchema = z.object({
  name: z.string().min(1),
  apiKey: z.string().min(1),
  hourlyLimit: z.number().int().positive().optional(),
  dailyLimit: z.number().int().positive().optional(),
})

/**
 * QR code response (for GET /api/sessions/:id/qr response)
 */
export const sessionQrResponseSchema = z.object({
  qrCodeData: z.string().optional(),
})

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type Session = z.infer<typeof sessionSchema>
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>
export type SessionQrResponse = z.infer<typeof sessionQrResponseSchema>
