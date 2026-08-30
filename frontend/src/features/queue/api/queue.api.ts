import type { QueueItem, LogEntry } from '@/types'
import { MOCK_QUEUE, MOCK_LOGS } from '@/mock-data'

// ─── Queue Queries ────────────────────────────────────────────────────────────

export async function getQueue(): Promise<QueueItem[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/queue`)
  return MOCK_QUEUE
}

// ─── Queue Mutations ──────────────────────────────────────────────────────────

export async function deleteQueueItem(_id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/queue/${id}`, { method: 'DELETE' })
  return
}

export async function retryQueueItem(_id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/queue/retry`, { method: 'POST', body: { id } })
  return
}

// ─── Log Queries ──────────────────────────────────────────────────────────────

export async function getLogs(): Promise<LogEntry[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/logs`)
  return MOCK_LOGS
}

// ─── Log Mutations ────────────────────────────────────────────────────────────

export async function clearLogs(): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/logs`, { method: 'DELETE' })
  return
}
