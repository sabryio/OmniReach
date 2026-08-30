// Dashboard aggregates — re-exports related keys for cross-feature invalidation
export { CampaignQueryKeys } from '@/features/campaigns/api/queryKeys'
export { SessionQueryKeys } from '@/features/sessions/api/queryKeys'
export { QueueQueryKeys, LogQueryKeys } from '@/features/queue/api/queryKeys'

const base = ['dashboard'] as const

export const DashboardQueryKeys = {
  all: base,
  overview: () => [...base, 'overview'] as const,
} as const
