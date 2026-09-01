import { config } from "@/lib/config";
import {
  sessionSchema,
  sessionsSchema,
  createSessionInputSchema,
  sessionQrResponseSchema,
  type Session,
  type CreateSessionInput,
  type SessionQrResponse,
} from "../schemas/session.schema";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions`, {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation — throws ZodError if shape doesn't match
  return sessionsSchema.parse(data);
}

export async function getSession(id: string): Promise<Session> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}`, {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch session ${id}: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return sessionSchema.parse(data);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createSession(
  input: CreateSessionInput,
): Promise<Session> {
  // Validate input before sending
  const validatedInput = createSessionInputSchema.parse(input);

  const response = await fetch(`${config.apiBaseUrl}/api/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return sessionSchema.parse(data);
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`);
  }
}

export async function resetSessionLimits(id: string): Promise<Session> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/sessions/${id}/reset-limits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.authToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to reset session limits: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return sessionSchema.parse(data);
}

export async function syncSession(id: string): Promise<Session> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to sync session: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return sessionSchema.parse(data);
}

export async function getSessionQr(id: string): Promise<SessionQrResponse> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}/qr`, {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get session QR: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return sessionQrResponseSchema.parse(data);
}

export type SendTestMessageParams = {
  sessionId: string;
  phone: string;
  message: string;
};

export async function sendTestMessage(
  _params: SendTestMessageParams,
): Promise<void> {
  // TODO: Phase 2 — implement /api/sessions/:id/send-test endpoint in backend
  throw new Error("Not implemented yet");
}

export type CheckContactParams = {
  sessionId: string;
  phone: string;
};

export async function checkContact(
  _params: CheckContactParams,
): Promise<{ registered: boolean }> {
  // TODO: Phase 2 — implement contact verification via /api/contacts/verify
  await new Promise((r) => setTimeout(r, 800));
  return { registered: Math.random() > 0.15 };
}
