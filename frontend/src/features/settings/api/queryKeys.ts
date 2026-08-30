const base = ['settings'] as const

export const SettingsQueryKeys = {
  all: base,
  config: () => [...base, 'config'] as const,
} as const
