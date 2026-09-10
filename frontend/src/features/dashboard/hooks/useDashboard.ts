import type { SchedulerState } from "@/features/layout/schemas/layout.schema";
import type { Campaign, LogEntry, QueueItem, Session } from "@/rpc/bindings";

// ============================================================================
// Computed Types (not from server)
// ============================================================================

/**
 * Computed rate quota information for a single session.
 * Derived from Session.hourly_sent_timestamps and Session.daily_sent_timestamps.
 */
export interface SessionRateQuota {
  sessionId: string;
  sessionName: string;
  hourlyUsed: number;
  hourlyLimit: number;
  hourlyRemaining: number;
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  isHourlyCapped: boolean;
  isDailyCapped: boolean;
  canSend: boolean;
  nextHourlySlotMs: number | null;
  nextDailySlotMs: number | null;
  reason: string | null;
}

interface UseDashboardProps {
  campaigns: Campaign[];
  queue: QueueItem[];
  sessions: Session[];
  schedulerState: SchedulerState;
  logs: LogEntry[];
}

/**
 * Compute a SessionRateQuota from raw session timestamps.
 * Mirrors RateLimiter.getSessionQuota() — replaced by real service in T007.
 */
function getSessionQuota(session: Session): SessionRateQuota {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const hourlyUsed = session.hourly_sent_timestamps.filter(
    (t) => t > oneHourAgo,
  ).length;
  const dailyUsed = session.daily_sent_timestamps.filter(
    (t) => t > oneDayAgo,
  ).length;

  const hourlyRemaining = Math.max(0, session.hourly_limit - hourlyUsed);
  const dailyRemaining = Math.max(0, session.daily_limit - dailyUsed);
  const isHourlyCapped = hourlyRemaining === 0;
  const isDailyCapped = dailyRemaining === 0;
  const canSend = !isHourlyCapped && !isDailyCapped;

  return {
    sessionId: session.id,
    sessionName: session.name,
    hourlyUsed,
    hourlyLimit: session.hourly_limit,
    hourlyRemaining,
    dailyUsed,
    dailyLimit: session.daily_limit,
    dailyRemaining,
    isHourlyCapped,
    isDailyCapped,
    canSend,
    nextHourlySlotMs: null,
    nextDailySlotMs: null,
    reason: null,
  };
}

export function useDashboard({
  campaigns,
  queue,
  sessions,
  schedulerState,
}: UseDashboardProps) {
  // Per-session quota map — keyed by session.id
  const sessionQuotas: Record<string, SessionRateQuota> = {};
  for (const s of sessions) {
    sessionQuotas[s.id] = getSessionQuota(s);
  }

  const totalAudience = campaigns.reduce((acc, c) => acc + c.total_contacts, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalUnregistered = campaigns.reduce(
    (acc, c) => acc + c.unregistered_count,
    0,
  );
  const totalFailed = campaigns.reduce((acc, c) => acc + c.failed_count, 0);
  const deliveryRate =
    totalAudience > 0 ? Math.round((totalDelivered / totalAudience) * 100) : 0;

  const pendingQueueCount = queue.filter(
    (q) =>
      q.status === "pending" ||
      q.status === "sending" ||
      q.status === "verifying",
  ).length;
  const heldRateLimitCount = queue.filter(
    (q) => q.status === "held_rate_limit" || q.status === "held_time_window",
  ).length;

  const totalHourlyRemaining = Object.values(sessionQuotas).reduce(
    (acc, q) => acc + q.hourlyRemaining,
    0,
  );
  const totalHourlyLimit = sessions.reduce(
    (acc, s) => acc + (s.hourly_limit || 5),
    0,
  );

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
  };
}
