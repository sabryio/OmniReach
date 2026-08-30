import { useState, useCallback, useMemo } from 'react'
import type { WABridgeSession, WABridgeConfig } from '@/types'

/**
 * Helper to format duration in ms to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

/**
 * Helper to calculate session quota and rate limits
 */
function getSessionQuota(session: WABridgeSession, now: number) {
  const hourAgo = now - 60 * 60 * 1000
  const dayAgo = now - 24 * 60 * 60 * 1000

  const hourlyUsed = session.hourlySentTimestamps.filter((t) => t > hourAgo).length
  const dailyUsed = session.dailySentTimestamps.filter((t) => t > dayAgo).length

  const hourlyLimit = session.hourlyLimit || 5
  const dailyLimit = session.dailyLimit || 30

  const isHourlyCapped = hourlyUsed >= hourlyLimit
  const isDailyCapped = dailyUsed >= dailyLimit

  const hourlyRemaining = Math.max(0, hourlyLimit - hourlyUsed)
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed)

  let nextHourlySlotMs: number | null = null
  if (isHourlyCapped && session.hourlySentTimestamps.length > 0) {
    const oldest = session.hourlySentTimestamps.filter((t) => t > hourAgo).sort((a, b) => a - b)[0]
    if (oldest) {
      nextHourlySlotMs = oldest + 60 * 60 * 1000 - now
    }
  }

  let nextDailySlotMs: number | null = null
  if (isDailyCapped && session.dailySentTimestamps.length > 0) {
    const oldest = session.dailySentTimestamps.filter((t) => t > dayAgo).sort((a, b) => a - b)[0]
    if (oldest) {
      nextDailySlotMs = oldest + 24 * 60 * 60 * 1000 - now
    }
  }

  const canSend = !isHourlyCapped && !isDailyCapped
  let reason = ''
  if (isHourlyCapped) reason = 'Hourly limit reached'
  else if (isDailyCapped) reason = 'Daily limit reached'

  return {
    hourlyUsed,
    hourlyLimit,
    hourlyRemaining,
    isHourlyCapped,
    dailyUsed,
    dailyLimit,
    dailyRemaining,
    isDailyCapped,
    canSend,
    reason,
    nextHourlySlotMs,
    nextDailySlotMs,
  }
}

/**
 * Comprehensive hook for SessionsDashboard component
 * Manages session quotas, verification testing, live updates
 */
export function useSessionDashboard(
  sessions: WABridgeSession[],
  _config: WABridgeConfig,
  onResetSessionLimits: (id: string) => void,
  onUpdateSessions: (sessions: WABridgeSession[]) => void
) {
  const [testPhone, setTestPhone] = useState<string>('+966 50 123 4567')
  const [testSessionId, setTestSessionId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Calculate quotas for all sessions
  const sessionQuotas = useMemo(() => {
    return sessions.map((session) => ({
      session,
      quota: getSessionQuota(session, currentTime),
    }))
  }, [sessions, currentTime])

  // Test verification
  const handleTestVerification = useCallback(
    async (sessionId: string) => {
      if (!testPhone.trim()) return
      setTestSessionId(sessionId)
      setTestResult('Checking...')

      try {
        // TODO: Implement actual WABridge verification
        // Simulate verification for now
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const isRegistered = !testPhone.endsWith('4') // mock logic
        setTestResult(
          isRegistered
            ? `✓ Registered — ${testPhone}@c.us`
            : '✗ Not registered on WhatsApp'
        )
      } catch (e) {
        setTestResult('Error: ' + String(e))
      }
    },
    [testPhone]
  )

  // Reset session limits
  const handleResetLimits = useCallback(
    (sessionId: string) => {
      onResetSessionLimits(sessionId)
      setTestResult(null)
    },
    [onResetSessionLimits]
  )

  // Update single session
  const updateSession = useCallback(
    (updated: WABridgeSession) => {
      onUpdateSessions(sessions.map((s) => (s.id === updated.id ? updated : s)))
    },
    [sessions, onUpdateSessions]
  )

  return {
    // Test verification
    testPhone,
    setTestPhone,
    testSessionId,
    testResult,
    setTestResult,
    handleTestVerification,

    // Session management
    sessionQuotas,
    handleResetLimits,
    updateSession,

    // Live updates
    currentTime,
    setCurrentTime,

    // Helpers
    formatDuration,
    getSessionQuota,
  }
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSessionDashboard instead
 */
export function useSessions(
  sessions: WABridgeSession[],
  _config: WABridgeConfig,
  onResetLimits: (id: string) => void,
  onUpdateSessions: (sessions: WABridgeSession[]) => void
) {
  const [testPhone, setTestPhone] = useState('')
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  const resetLimits = useCallback((id: string) => onResetLimits(id), [onResetLimits])

  const updateSession = useCallback(
    (updated: WABridgeSession) => {
      onUpdateSessions(sessions.map((s) => (s.id === updated.id ? updated : s)))
    },
    [sessions, onUpdateSessions]
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
        [sessionId]: isRegistered ? `✓ Registered — ${testPhone}@c.us` : '✗ Not registered on WhatsApp',
      }))
    },
    [testPhone]
  )

  return { testPhone, setTestPhone, testResults, resetLimits, updateSession, testVerify }
}
