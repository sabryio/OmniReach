const base = ['contacts'] as const

export const ContactQueryKeys = {
  all: base,
  lists: () => [...base, 'list'] as const,
  list: () => [...base, 'list'] as const,
  details: () => [...base, 'detail'] as const,
  detail: (id: string) => [...base, 'detail', id] as const,
} as const
