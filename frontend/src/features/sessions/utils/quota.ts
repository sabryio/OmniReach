/**
 * Session Quota Utilities
 * Shared helpers for rate-limit calculations
 */

import type { Session } from '../schemas/session.schema'

/**
 * Helper to format duration in ms to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

/**
 * Calculate session quota and rate limits
 * 
 * @param session - The session to calculate quota for
 * @param now - Current timestamp in milliseconds
 * @returns Quota metrics including used/available slots and next available times
 */
export function getSessionQuota(session: Session, now: number) {
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
