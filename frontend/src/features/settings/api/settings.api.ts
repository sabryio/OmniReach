import { config } from "@/lib/config";
import {
  appSettingsSchema,
  updateSettingsInputSchema,
  type AppSettings,
  type UpdateSettingsInput,
} from "../schemas/settings.schema";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const response = await fetch(`${config.apiBaseUrl}/api/settings`, {
    headers: { Authorization: `Bearer ${config.authToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch settings: ${response.statusText}`);
  return appSettingsSchema.parse(await response.json());
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateSettings(
  patch: UpdateSettingsInput,
): Promise<AppSettings> {
  const validatedPatch = updateSettingsInputSchema.parse(patch);
  const response = await fetch(`${config.apiBaseUrl}/api/settings`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedPatch),
  });
  if (!response.ok)
    throw new Error(`Failed to update settings: ${response.statusText}`);
  return appSettingsSchema.parse(await response.json());
}
