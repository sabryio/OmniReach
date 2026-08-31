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
  campaignId: z.string().uuid().optional(), // optional — standalone contacts not yet in a campaign
  name: z.string(),
  rawPhone: z.string(),
  formattedPhone: z.string(),
  normalizedPhone: z.string(),
  customFields: z.record(z.string(), z.string()),
  verificationStatus: contactVerificationStatusSchema,
  verificationError: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  waId: z.string().optional(),
});

export const campaignSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  templateText: z.string(),
  imageUrl: z.string().optional(),
  imageFileName: z.string().optional(),
  sessionIds: z.array(z.string().uuid()),
  status: campaignStatusSchema,
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
  totalContacts: z.number().int(),
  verifiedContacts: z.number().int(),
  unregisteredCount: z.number().int(),
  sentCount: z.number().int(),
  skippedCount: z.number().int(),
  failedCount: z.number().int(),
  isArchived: z.boolean(),
  archivedAt: z.string().datetime().optional(),
  contacts: z.array(contactSchema),
});

export const campaignsSchema = z.array(campaignSchema);

export const createCampaignInputSchema = z.object({
  title: z.string().min(1),
  templateText: z.string().min(1),
  imageUrl: z.string().url().optional(),
  sessionIds: z.array(z.string().uuid()),
  contacts: z.array(
    z.object({
      name: z.string(),
      rawPhone: z.string(),
      formattedPhone: z.string(),
      normalizedPhone: z.string(),
      customFields: z.record(z.string(), z.string()).default({}),
    }),
  ),
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
