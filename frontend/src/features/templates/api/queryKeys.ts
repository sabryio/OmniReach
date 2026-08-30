/**
 * Templates Query Keys — Hierarchical structure for TanStack Query cache
 */

const base = ['templates'] as const

export const TemplateQueryKeys = {
  all: base,
  lists: () => [...base, 'list'] as const,
  list: (filters?: unknown) => [...base, 'list', filters] as const,
  details: () => [...base, 'detail'] as const,
  detail: (id: string) => [...base, 'detail', id] as const,
} as const
