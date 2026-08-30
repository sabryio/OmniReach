import { useCampaignsQuery } from '@/features/campaigns/hooks/useCampaignsQuery'
import { useSessions } from '@/features/sessions/hooks/useSessionsQuery'
import { useQueueQuery, useLogsQuery } from '@/features/queue/hooks/useQueueQuery'

/**
 * Composite hook that aggregates data for the Dashboard from all feature queries.
 * Each sub-query uses its own cache key — mutations anywhere will correctly
 * invalidate only the relevant slice.
 */
export function useDashboardData() {
  const { campaigns, isLoading: campaignsLoading } = useCampaignsQuery()
  const { sessions, isLoading: sessionsLoading } = useSessions()
  const { queue, isLoading: queueLoading } = useQueueQuery()
  const { logs, isLoading: logsLoading } = useLogsQuery()

  const isLoading = campaignsLoading || sessionsLoading || queueLoading || logsLoading

  return {
    campaigns,
    sessions,
    queue,
    logs,
    isLoading,
  }
}
