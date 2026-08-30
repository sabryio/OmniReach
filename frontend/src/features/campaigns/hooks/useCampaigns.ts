import { useState, useCallback, useMemo } from 'react'
import type { Campaign, MessageTemplate, Contact, QueueItem } from '@/types'

/**
 * Comprehensive hook for CampaignsList component
 * Manages all state: view tabs, filters, selection, contact filtering, queue integration
 */
export function useCampaignsList(campaigns: Campaign[], queue: QueueItem[]) {
  // Tab: 'active' (non-archived) vs 'archived'
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active')

  // Campaign list filters
  const [campaignSearch, setCampaignSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused' | 'completed' | 'draft'>('all')

  // Contact/recipient filters
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('')
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>('all')

  // Partition campaigns
  const activeCampaigns = useMemo(() => campaigns.filter((c) => !c.isArchived), [campaigns])
  const archivedCampaigns = useMemo(() => campaigns.filter((c) => !!c.isArchived), [campaigns])

  const currentTabList = viewTab === 'active' ? activeCampaigns : archivedCampaigns

  // Selection state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() => {
    if (activeCampaigns.length > 0 && activeCampaigns[0]) {
      return activeCampaigns[0].id
    }
    if (campaigns.length > 0 && campaigns[0]) {
      return campaigns[0].id
    }
    return ''
  })

  // Filtered campaigns list
  const filteredCampaigns = useMemo(() => {
    return currentTabList.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(campaignSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(campaignSearch.toLowerCase())
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [currentTabList, campaignSearch, statusFilter])

  // Keep selection valid
  const selectedCampaign = useMemo(() => {
    return (
      filteredCampaigns.find((c) => c.id === selectedCampaignId) ||
      currentTabList.find((c) => c.id === selectedCampaignId) ||
      filteredCampaigns[0] ||
      currentTabList[0] ||
      null
    )
  }, [filteredCampaigns, currentTabList, selectedCampaignId])

  // Queue items for selected campaign
  const selectedCampaignQueue = useMemo(() => {
    return selectedCampaign ? queue.filter((q) => q.campaignId === selectedCampaign.id) : []
  }, [selectedCampaign, queue])

  // Filtered contacts for detail pane
  const filteredContacts = useMemo(() => {
    if (!selectedCampaign) return []

    return (selectedCampaign.contacts ?? []).filter((c) => {
      const qItem = selectedCampaignQueue.find((q) => q.contactId === c.id)
      const matchesSearch =
        c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        c.rawPhone.includes(contactSearchQuery)

      if (recipientStatusFilter === 'all') return matchesSearch
      if (recipientStatusFilter === 'sent')
        return matchesSearch && qItem?.status === 'sent'
      if (recipientStatusFilter === 'skipped')
        return (
          matchesSearch &&
          (c.verificationStatus === 'unregistered' || qItem?.status === 'skipped_unregistered')
        )
      if (recipientStatusFilter === 'pending')
        return (
          matchesSearch &&
          (!qItem || qItem.status === 'pending' || qItem.status === 'held_rate_limit')
        )
      if (recipientStatusFilter === 'failed')
        return matchesSearch && qItem?.status === 'failed'
      return matchesSearch
    })
  }, [selectedCampaign, selectedCampaignQueue, contactSearchQuery, recipientStatusFilter])

  // Switch tabs and update selection
  const switchToActiveTab = useCallback(() => {
    setViewTab('active')
    if (activeCampaigns.length > 0 && activeCampaigns[0]) {
      setSelectedCampaignId(activeCampaigns[0].id)
    }
  }, [activeCampaigns])

  const switchToArchivedTab = useCallback(() => {
    setViewTab('archived')
    if (archivedCampaigns.length > 0 && archivedCampaigns[0]) {
      setSelectedCampaignId(archivedCampaigns[0].id)
    }
  }, [archivedCampaigns])

  return {
    // View state
    viewTab,
    setViewTab,
    activeCampaigns,
    archivedCampaigns,
    currentTabList,
    switchToActiveTab,
    switchToArchivedTab,

    // Campaign list filters
    campaignSearch,
    setCampaignSearch,
    statusFilter,
    setStatusFilter,
    filteredCampaigns,

    // Selection
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCampaign,
    selectedCampaignQueue,

    // Contact/recipient filters
    contactSearchQuery,
    setContactSearchQuery,
    recipientStatusFilter,
    setRecipientStatusFilter,
    filteredContacts,
  }
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useCampaignsList instead
 */
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
