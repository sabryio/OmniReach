import type { WABridgeSession } from '@/types'
import { config } from '@/lib/config'

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<WABridgeSession[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions`, {
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`)
  }

  return response.json()
}

export async function getSession(id: string): Promise<WABridgeSession> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}`, {
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch session ${id}: ${response.statusText}`)
  }

  return response.json()
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateSessionParams = {
  name: string
  apiKey: string
  hourlyLimit?: number
  dailyLimit?: number
}

export async function createSession(params: CreateSessionParams): Promise<WABridgeSession> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`)
  }

  return response.json()
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`)
  }
}

export async function resetSessionLimits(id: string): Promise<WABridgeSession> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}/reset-limits`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to reset session limits: ${response.statusText}`)
  }

  return response.json()
}

export async function syncSession(id: string): Promise<WABridgeSession> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to sync session: ${response.statusText}`)
  }

  return response.json()
}

export async function getSessionQr(id: string): Promise<{ qrCodeData?: string }> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions/${id}/qr`, {
    headers: {
      'Authorization': `Bearer ${config.authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get session QR: ${response.statusText}`)
  }

  return response.json()
}

export type SendTestMessageParams = {
  sessionId: string
  phone: string
  message: string
}

export async function sendTestMessage(_params: SendTestMessageParams): Promise<void> {
  // TODO: Phase 2 — implement /api/sessions/:id/send-test endpoint in backend
  throw new Error('Not implemented yet')
}

export type CheckContactParams = {
  sessionId: string
  phone: string
}

export async function checkContact(_params: CheckContactParams): Promise<{ registered: boolean }> {
  // TODO: Phase 2 — implement contact verification via /api/contacts/verify
  await new Promise((r) => setTimeout(r, 800))
  return { registered: Math.random() > 0.15 }
}
