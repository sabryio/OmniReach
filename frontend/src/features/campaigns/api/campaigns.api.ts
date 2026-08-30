import type { Campaign, Contact } from '@/types'
import { MOCK_CAMPAIGNS } from '@/mock-data'
import type { Template } from '@/features/templates'

export async function getCampaigns(): Promise<Campaign[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/campaigns`)
  return MOCK_CAMPAIGNS
}

export async function getCampaign(id: string): Promise<Campaign> {
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id)
  if (!campaign) throw new Error(`Campaign ${id} not found`)
  return campaign
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateCampaignParams = {
  title: string
  template: Template
  contacts: Contact[]
  sessionIds: string[]
}

export async function createCampaign(params: CreateCampaignParams): Promise<Campaign> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/campaigns`, { method: 'POST', ... })
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    title: params.title,
    status: 'running',
    totalContacts: params.contacts.length,
    sentCount: 0,
    unregisteredCount: 0,
    failedCount: 0,
    createdAt: Date.now(),
    startedAt: Date.now(),
    templateText: params.template.text,
    imageUrl: params.template.imageUrl,
    isArchived: false,
    contacts: params.contacts,
  }
  return newCampaign
}

export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>,
): Promise<Campaign> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/campaigns/${id}`, { method: 'PATCH', ... })
  const campaign = await getCampaign(id)
  return { ...campaign, ...updates }
}

export async function deleteCampaign(_id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/campaigns/${id}`, { method: 'DELETE' })
  return
}

export async function pauseCampaign(id: string): Promise<Campaign> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/campaigns/${id}/pause`, { method: 'POST' })
  return updateCampaign(id, { status: 'paused' })
}

export async function resumeCampaign(id: string): Promise<Campaign> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/campaigns/${id}/resume`, { method: 'POST' })
  return updateCampaign(id, { status: 'running' })
}

export async function archiveCampaign(id: string): Promise<Campaign> {
  return updateCampaign(id, { isArchived: true })
}

export async function unarchiveCampaign(id: string): Promise<Campaign> {
  return updateCampaign(id, { isArchived: false })
}
