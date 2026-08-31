import { config } from "@/lib/config";
import {
  campaignSchema,
  campaignsSchema,
  createCampaignInputSchema,
  retryFailedResponseSchema,
  type Campaign,
  type CreateCampaignInput,
} from "../schemas/campaign.schema";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/campaigns`, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
  return campaignsSchema.parse(await response.json());
}

export async function getCampaign(id: string): Promise<Campaign> {
  const response = await fetch(`${config.apiBaseUrl}/api/campaigns/${id}`, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch campaign ${id}: ${response.statusText}`);
  return campaignSchema.parse(await response.json());
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<Campaign> {
  const validatedInput = createCampaignInputSchema.parse(input);
  const response = await fetch(`${config.apiBaseUrl}/api/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedInput),
  });
  if (!response.ok)
    throw new Error(`Failed to create campaign: ${response.statusText}`);
  return campaignSchema.parse(await response.json());
}

export async function deleteCampaign(id: string): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/campaigns/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to delete campaign: ${response.statusText}`);
}

export async function pauseCampaign(id: string): Promise<Campaign> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/campaigns/${id}/pause`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.authToken}` },
    },
  );
  if (!response.ok)
    throw new Error(`Failed to pause campaign: ${response.statusText}`);
  return campaignSchema.parse(await response.json());
}

export async function resumeCampaign(id: string): Promise<Campaign> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/campaigns/${id}/resume`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.authToken}` },
    },
  );
  if (!response.ok)
    throw new Error(`Failed to resume campaign: ${response.statusText}`);
  return campaignSchema.parse(await response.json());
}

export async function archiveCampaign(id: string): Promise<Campaign> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/campaigns/${id}/archive`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.authToken}` },
    },
  );
  if (!response.ok)
    throw new Error(`Failed to archive campaign: ${response.statusText}`);
  return campaignSchema.parse(await response.json());
}

export async function unarchiveCampaign(id: string): Promise<Campaign> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/campaigns/${id}/unarchive`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.authToken}` },
    },
  );
  if (!response.ok)
    throw new Error(`Failed to unarchive campaign: ${response.statusText}`);
  return campaignSchema.parse(await response.json());
}

export async function retryFailedCampaign(
  id: string,
): Promise<{ queuedCount: number }> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/campaigns/${id}/retry-failed`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${config.authToken}` },
    },
  );
  if (!response.ok)
    throw new Error(`Failed to retry campaign: ${response.statusText}`);
  return retryFailedResponseSchema.parse(await response.json());
}
