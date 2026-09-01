import { config } from "@/lib/config";
import {
  sessionSchema,
  sessionsSchema,
  createSessionInputSchema,
  type Session,
  type CreateSessionInput,
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

export type UpdateSessionParams = {
  id: string;
  name?: string;
  apiKey?: string;
  hourlyLimit?: number;
  dailyLimit?: number;
};

export async function updateSession(
  params: UpdateSessionParams,
): Promise<Session> {
  const { id, ...updates } = params;

  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update session: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return sessionSchema.parse(data);
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

export type SendTestMessageParams = {
  sessionId: string;
  phone: string;
  message: string;
};

export async function sendTestMessage(
  params: SendTestMessageParams,
): Promise<void> {
  const response = await fetch(
    `${config.apiBaseUrl}/api/sessions/${params.sessionId}/send-test`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: params.phone,
        message: params.message,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send test message: ${response.statusText} - ${errorText}`,
    );
  }
}
