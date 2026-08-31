/**
 * Customers Domain — Zod Schemas (Single Source of Truth)
 *
 * Contact is defined in the campaigns schema (contacts belong to campaigns).
 * Re-exported here for use by the customers feature.
 */

export {
  contactSchema,
  contactVerificationStatusSchema,
  type Contact,
} from "@/features/campaigns/schemas/campaign.schema";

// Re-export the inferred type alias explicitly
export type { ContactVerificationStatus } from "@/features/campaigns/schemas/campaign.schema";
