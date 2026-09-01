const base = ["contacts"] as const;

export const ContactQueryKeys = {
  all: base,
  lists: () => [...base, "list"] as const,
  list: (campaignId?: string) => [...base, "list", campaignId] as const,
} as const;
