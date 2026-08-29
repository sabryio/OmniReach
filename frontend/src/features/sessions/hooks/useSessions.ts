import { useState, useCallback } from 'react'
import type { WABridgeSession, WABridgeConfig } from '@/types'

export function useSessions(
  sessions: WABridgeSession[],
  _config: WABridgeConfig,
  onResetLimits: (id: string) => void,
  onUpdateSessions: (sessions: WABridgeSession[]) => void,
) {
  const [testPhone, setTestPhone] = useState('')
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  const resetLimits = useCallback(
    (id: string) => onResetLimits(id),
    [onResetLimits],
  )

  const updateSession = useCallback(
    (updated: WABridgeSession) => {
      onUpdateSessions(sessions.map((s) => (s.id === updated.id ? updated : s)))
    },
    [sessions, onUpdateSessions],
  )

  const testVerify = useCallback(
    async (sessionId: string) => {
      if (!testPhone.trim()) return
      setTestResults((p) => ({ ...p, [sessionId]: 'checking…' }))
      // Placeholder: simulate API call
      await new Promise((r) => setTimeout(r, 800))
      const isRegistered = !testPhone.endsWith('4') // mock logic
      setTestResults((p) => ({
        ...p,
        [sessionId]: isRegistered
          ? `✓ Registered — ${testPhone}@c.us`
          : '✗ Not registered on WhatsApp',
      }))
    },
    [testPhone],
  )

  return { testPhone, setTestPhone, testResults, resetLimits, updateSession, testVerify }
}
