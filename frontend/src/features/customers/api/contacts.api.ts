import { config } from "@/lib/config";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const verifyBatchResponseSchema = z.object({
  job_id: z.string(),
});

export const verifyResultItemSchema = z.object({
  phone: z.string(),
  is_registered: z.boolean(),
  wa_id: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const verifyCompletePayloadSchema = z.object({
  job_id: z.string(),
  results: z.array(verifyResultItemSchema),
});

export const verifyProgressPayloadSchema = z.object({
  job_id: z.string(),
  checked: z.number(),
  total: z.number(),
  registered: z.number(),
  unregistered: z.number(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type VerifyResultItem = z.infer<typeof verifyResultItemSchema>;
export type VerifyProgressPayload = z.infer<typeof verifyProgressPayloadSchema>;
export type VerifyCompletePayload = z.infer<typeof verifyCompletePayloadSchema>;

// ─── API Functions ────────────────────────────────────────────────────────────

export type VerifyBatchParams = {
  sessionId: string;
  phones: string[];
};

/**
 * POST /api/contacts/verify-batch
 * Returns immediately with a job_id. Progress and results stream via SSE:
 *   event: contact.verify_progress
 *   event: contact.verify_complete
 */
export async function verifyBatch(
  params: VerifyBatchParams,
): Promise<{ jobId: string }> {
  console.log("🔍 [VERIFY] Starting batch verification:", {
    sessionId: params.sessionId,
    phoneCount: params.phones.length,
    phones: params.phones,
  });

  const response = await fetch(
    `${config.apiBaseUrl}/api/contacts/verify-batch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: params.sessionId,
        phones: params.phones,
      }),
    },
  );

  console.log(
    "🔍 [VERIFY] Response status:",
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    const body = await response.text().catch(() => response.statusText);
    console.error("🔍 [VERIFY] ❌ Request failed:", body);
    throw new Error(`Failed to start verification batch: ${body}`);
  }

  const rawData = await response.json();
  console.log("🔍 [VERIFY] Raw response data:", rawData);

  const data = verifyBatchResponseSchema.parse(rawData);
  console.log("🔍 [VERIFY] ✅ Job started, job_id:", data.job_id);

  return { jobId: data.job_id };
}
