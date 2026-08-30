import type { WABridgeConfig } from '@/types'

// Default config — frontend-only until GET/PUT /api/settings is implemented
const DEFAULT_CONFIG: WABridgeConfig = {
  baseUrl: 'http://127.0.0.1:8080',
  timeoutMs: 5000,
  useSimulationMode: true,
  simulatedNetworkLatencyMs: 400,
  simulatedUnregisteredRate: 0.15,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<WABridgeConfig> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/settings`)
  return DEFAULT_CONFIG
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateSettings(settings: WABridgeConfig): Promise<WABridgeConfig> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/settings`, { method: 'PUT', ... })
  return settings
}
