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
  campaignId: z.string().uuid().nullable(), // nullable for standalone contacts
  name: z.string(),
  rawPhone: z.string(),
  formattedPhone: z.string(),
  normalizedPhone: z.string(),
  customFields: z.record(z.string(), z.string()),
  verificationStatus: contactVerificationStatusSchema,
  verificationError: z.string().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  waId: z.string().nullable(),
});

export const campaignSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  templateText: z.string(),
  imageUrl: z.string().nullable(),
  imageFileName: z.string().nullable(),
  mediaRef: z.string().nullable(), // WABridge media reference from upload
  sessionIds: z.array(z.string().uuid()),
  status: campaignStatusSchema,
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  scheduledFor: z.string().datetime().nullable(),
  totalContacts: z.number().int(),
  verifiedContacts: z.number().int(),
  unregisteredCount: z.number().int(),
  sentCount: z.number().int(),
  skippedCount: z.number().int(),
  failedCount: z.number().int(),
  isArchived: z.boolean(),
  archivedAt: z.string().datetime().nullable(),
  contacts: z.array(contactSchema),
});

export const campaignsSchema = z.array(campaignSchema);

export const createCampaignInputSchema = z.object({
  title: z.string().min(1),
  templateText: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  mediaRef: z.string().nullable(),
  sessionIds: z.array(z.string().uuid()),
  contacts: z.array(
    z.object({
      name: z.string(),
      rawPhone: z.string(),
      formattedPhone: z.string(),
      normalizedPhone: z.string(),
      customFields: z.record(z.string(), z.string()).default({}),
      verificationStatus: contactVerificationStatusSchema.optional(),
      waId: z.string().nullable(),
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
