import type { Campaign, QueueItem, WABridgeSession, SchedulerState, LogEntry, SessionRateQuota } from '@/types'

interface UseDashboardProps {
  campaigns: Campaign[]
  queue: QueueItem[]
  sessions: WABridgeSession[]
  schedulerState: SchedulerState
  logs: LogEntry[]
}

/**
 * Compute a SessionRateQuota from raw session timestamps.
 * Mirrors RateLimiter.getSessionQuota() — replaced by real service in T007.
 */
function getSessionQuota(session: WABridgeSession): SessionRateQuota {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  const hourlyUsed = session.hourlySentTimestamps.filter((t) => t > oneHourAgo).length
  const dailyUsed = session.dailySentTimestamps.filter((t) => t > oneDayAgo).length

  const hourlyRemaining = Math.max(0, session.hourlyLimit - hourlyUsed)
  const dailyRemaining = Math.max(0, session.dailyLimit - dailyUsed)
  const isHourlyCapped = hourlyRemaining === 0
  const isDailyCapped = dailyRemaining === 0
  const canSend = !isHourlyCapped && !isDailyCapped

  return {
    sessionId: session.id,
    sessionName: session.name,
    hourlyUsed,
    hourlyLimit: session.hourlyLimit,
    hourlyRemaining,
    dailyUsed,
    dailyLimit: session.dailyLimit,
    dailyRemaining,
    isHourlyCapped,
    isDailyCapped,
    canSend,
  }
}

export function useDashboard({
  campaigns,
  queue,
  sessions,
  schedulerState,
}: UseDashboardProps) {
  // Per-session quota map — keyed by session.id
  const sessionQuotas: Record<string, SessionRateQuota> = {}
  for (const s of sessions) {
    sessionQuotas[s.id] = getSessionQuota(s)
  }

  const totalAudience = campaigns.reduce((acc, c) => acc + c.totalContacts, 0)
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.sentCount, 0)
  const totalUnregistered = campaigns.reduce((acc, c) => acc + c.unregisteredCount, 0)
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0)
  const deliveryRate = totalAudience > 0 ? Math.round((totalDelivered / totalAudience) * 100) : 0

  const pendingQueueCount = queue.filter(
    (q) => q.status === 'pending' || q.status === 'sending' || q.status === 'verifying',
  ).length
  const heldRateLimitCount = queue.filter(
    (q) => q.status === 'held_rate_limit' || q.status === 'held_time_window',
  ).length

  const totalHourlyRemaining = Object.values(sessionQuotas).reduce(
    (acc, q) => acc + q.hourlyRemaining,
    0,
  )
  const totalHourlyLimit = sessions.reduce((acc, s) => acc + (s.hourlyLimit || 5), 0)

  return {
    sessionQuotas,
    totalAudience,
    totalDelivered,
    totalUnregistered,
    totalFailed,
    deliveryRate,
    pendingQueueCount,
    heldRateLimitCount,
    totalHourlyRemaining,
    totalHourlyLimit,
    // kept for convenience
    queuePending: schedulerState.totalQueuePending,
    queueHeld: schedulerState.totalQueueHeld,
  }
}
