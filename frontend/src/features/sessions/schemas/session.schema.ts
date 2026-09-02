/**
 * Sessions Domain — Zod Schemas (Single Source of Truth)
 *
 * These schemas define the shape of Session data at runtime and compile time.
 * The backend Rust types MUST serialize to match these schemas.
 */

import { z } from "zod";

/**
 * Session status enum — simplified to connected/disconnected.
 * QR code pairing is handled by WABridge console, not OmniReach UI.
 */
export const sessionStatusSchema = z.enum(["connected", "disconnected"]);

/**
 * WABridge Session — matches Rust Session type (camelCase serialization)
 */
export const sessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phoneNumber: z.string().min(1, "Phone number is required"),
  status: sessionStatusSchema,
  hourlyLimit: z.number().int().nonnegative(),
  dailyLimit: z.number().int().nonnegative(),
  hourlySentTimestamps: z.array(z.number().int()),
  dailySentTimestamps: z.array(z.number().int()),
  lastActivityAt: z.string().datetime().nullable(), // ISO 8601 from Rust DateTime<Utc>
});

/**
 * Array of sessions (for GET /api/sessions response)
 */
export const sessionsSchema = z.array(sessionSchema);

/**
 * Create session input (for POST /api/sessions request body)
 */
export const createSessionInputSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format (10-15 digits)"),
  apiKey: z.string().min(1, "API key is required"),
  hourlyLimit: z.number().int().positive().optional(),
  dailyLimit: z.number().int().positive().optional(),
});

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;
