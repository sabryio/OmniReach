import { useState, useCallback } from 'react'
import type { Campaign, MessageTemplate, Contact } from '@/types'

export function useCampaigns(campaigns: Campaign[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused' | 'completed' | 'draft'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [search, setSearch] = useState('')

  const selected = campaigns.find((c) => c.id === selectedId) ?? null

  const filtered = campaigns.filter((c) => {
    if (c.isArchived !== showArchived) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return {
    selected,
    selectedId,
    setSelectedId,
    statusFilter,
    setStatusFilter,
    showArchived,
    setShowArchived,
    search,
    setSearch,
    filtered,
  }
}

export function useCampaignWizard() {
  const [step, setStep] = useState<'csv' | 'composer' | 'sessions' | 'review'>('csv')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templateText, setTemplateText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [campaignTitle, setCampaignTitle] = useState('')
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])

  const canAdvance =
    (step === 'csv' && contacts.length > 0) ||
    (step === 'composer' && templateText.trim().length > 0) ||
    (step === 'sessions' && selectedSessionIds.length > 0) ||
    step === 'review'

  const next = useCallback(() => {
    const order: typeof step[] = ['csv', 'composer', 'sessions', 'review']
    const idx = order.indexOf(step)
    if (idx < order.length - 1) setStep(order[idx + 1]!)
  }, [step])

  const back = useCallback(() => {
    const order: typeof step[] = ['csv', 'composer', 'sessions', 'review']
    const idx = order.indexOf(step)
    if (idx > 0) setStep(order[idx - 1]!)
  }, [step])

  const initFromTemplate = useCallback((t: MessageTemplate) => {
    setTemplateText(t.text)
    setImageUrl(t.imageUrl)
    setCampaignTitle(t.title)
    setStep('composer')
  }, [])

  const initFromContacts = useCallback((c: Contact[]) => {
    setContacts(c)
    setStep('composer')
  }, [])

  return {
    step,
    contacts,
    setContacts,
    templateText,
    setTemplateText,
    imageUrl,
    setImageUrl,
    campaignTitle,
    setCampaignTitle,
    selectedSessionIds,
    setSelectedSessionIds,
    canAdvance,
    next,
    back,
    initFromTemplate,
    initFromContacts,
  }
}
