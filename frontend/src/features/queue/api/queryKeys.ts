const queueBase = ['queue'] as const
const logsBase = ['logs'] as const

export const QueueQueryKeys = {
  all: queueBase,
  lists: () => [...queueBase, 'list'] as const,
  list: () => [...queueBase, 'list'] as const,
} as const

export const LogQueryKeys = {
  all: logsBase,
  lists: () => [...logsBase, 'list'] as const,
  list: () => [...logsBase, 'list'] as const,
} as const
