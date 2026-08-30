/**
 * Templates Domain — Zod Schemas (Single Source of Truth)
 * 
 * These schemas define the shape of MessageTemplate data at runtime and compile time.
 * The backend Rust types MUST serialize to match these schemas.
 */

import { z } from 'zod'

/**
 * MessageTemplate — matches backend Template type (camelCase serialization)
 */
export const templateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  category: z.string().min(1),
  categoryAr: z.string().optional(),
  text: z.string().min(1),
  textAr: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageFileName: z.string().optional(),
  suggestedVariables: z.array(z.string()),
  createdAt: z.string().datetime().optional(), // ISO 8601 from Rust DateTime<Utc>
  updatedAt: z.string().datetime().optional(),
})

/**
 * Array of templates (for GET /api/templates response)
 */
export const templatesSchema = z.array(templateSchema)

/**
 * Create template input (for POST /api/templates request body)
 */
export const createTemplateInputSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  category: z.string().min(1),
  categoryAr: z.string().optional(),
  text: z.string().min(1),
  textAr: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageFileName: z.string().optional(),
  suggestedVariables: z.array(z.string()).default([]),
})

/**
 * Update template input (for PATCH /api/templates/:id request body)
 */
export const updateTemplateInputSchema = createTemplateInputSchema.partial()

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type Template = z.infer<typeof templateSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>
