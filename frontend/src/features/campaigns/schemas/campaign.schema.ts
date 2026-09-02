/**
 * Campaigns Domain — Zod Schemas (Single Source of Truth)
 */

import { z } from "zod";

export const campaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
]);

export const contactVerificationStatusSchema = z.enum([
  "unverified",
  "checking",
  "registered",
  "unregistered",
  "error",
]);

export const contactSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid().nullable().optional(), // nullable for standalone contacts
  name: z.string(),
  rawPhone: z.string(),
  formattedPhone: z.string(),
  normalizedPhone: z.string(),
  customFields: z.record(z.string(), z.string()),
  verificationStatus: contactVerificationStatusSchema,
  verificationError: z.string().nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  waId: z.string().nullable().optional(),
});

export const campaignSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  templateText: z.string(),
  imageUrl: z.string().nullable().optional(),
  imageFileName: z.string().nullable().optional(),
  mediaRef: z.string().nullable().optional(), // WABridge media reference from upload
  sessionIds: z.array(z.string().uuid()),
  status: campaignStatusSchema,
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  totalContacts: z.number().int(),
  verifiedContacts: z.number().int(),
  unregisteredCount: z.number().int(),
  sentCount: z.number().int(),
  skippedCount: z.number().int(),
  failedCount: z.number().int(),
  isArchived: z.boolean(),
  archivedAt: z.string().datetime().nullable().optional(),
  contacts: z.array(contactSchema),
});

export const campaignsSchema = z.array(campaignSchema);

export const createCampaignInputSchema = z.object({
  title: z.string().min(1),
  templateText: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  mediaRef: z.string().nullable().optional(),
  sessionIds: z.array(z.string().uuid()),
  contacts: z.array(
    z.object({
      name: z.string(),
      rawPhone: z.string(),
      formattedPhone: z.string(),
      normalizedPhone: z.string(),
      customFields: z.record(z.string(), z.string()).default({}),
      verificationStatus: contactVerificationStatusSchema.optional(),
      waId: z.string().nullable().optional(),
    }),
  ),
  status: campaignStatusSchema.optional(),
});

export const retryFailedResponseSchema = z.object({
  queuedCount: z.number().int(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
export type ContactVerificationStatus = z.infer<
  typeof contactVerificationStatusSchema
>;
export type Contact = z.infer<typeof contactSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
