import type { WABridgeSession } from '@/types'
import { MOCK_SESSIONS } from '@/mock-data'

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<WABridgeSession[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions`)
  return MOCK_SESSIONS
}

export async function getSession(id: string): Promise<WABridgeSession> {
  const session = MOCK_SESSIONS.find((s) => s.id === id)
  if (!session) throw new Error(`Session ${id} not found`)
  return session
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateSessionParams = {
  id: string
  name: string
  phoneNumber?: string
}

export async function createSession(params: CreateSessionParams): Promise<WABridgeSession> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions`, { method: 'POST', ... })
  const newSession: WABridgeSession = {
    id: params.id,
    name: params.name,
    phoneNumber: params.phoneNumber ?? '',
    status: 'disconnected',
    hourlyLimit: 60,
    dailyLimit: 600,
    hourlySentTimestamps: [],
    dailySentTimestamps: [],
  }
  return newSession
}

export async function deleteSession(_id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions/${id}`, { method: 'DELETE' })
  return
}

export type SendTestMessageParams = {
  sessionId: string
  phone: string
  message: string
}

export async function sendTestMessage(_params: SendTestMessageParams): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions/${params.sessionId}/send`, { method: 'POST', ... })
  return
}

export type CheckContactParams = {
  sessionId: string
  phone: string
}

export async function checkContact(
  _params: CheckContactParams,
): Promise<{ registered: boolean }> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions/${params.sessionId}/check-contact`, { method: 'POST', ... })
  await new Promise((r) => setTimeout(r, 800))
  return { registered: Math.random() > 0.15 }
}
