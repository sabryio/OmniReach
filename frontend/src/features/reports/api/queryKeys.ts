// Reports reads from campaigns + queue — no dedicated backend endpoint
// Re-exports related keys for cross-feature invalidation
export { CampaignQueryKeys } from '@/features/campaigns/api/queryKeys'
export { QueueQueryKeys, LogQueryKeys } from '@/features/queue/api/queryKeys'

const base = ['reports'] as const

export const ReportQueryKeys = {
  all: base,
  overview: () => [...base, 'overview'] as const,
} as const
