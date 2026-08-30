import { useState, useCallback, useMemo } from 'react'
import type { Contact, ContactVerificationStatus, WABridgeSession } from '@/types'

// Built-in default pharmacy contacts
const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'cust_01',
    name: 'Dr. Sabry El-Sayed',
    rawPhone: '+1 (415) 555-9901',
    formattedPhone: '14155559901',
    normalizedPhone: '+14155559901',
    customFields: {
      category: 'Chronic Care',
      prescription: 'Lipitor 20mg',
      doctor: 'Dr. Roberts',
    },
    verificationStatus: 'registered',
    waId: '14155559901@c.us',
  },
  {
    id: 'cust_02',
    name: 'Victoria Sterling',
    rawPhone: '+44 7700 900888',
    formattedPhone: '447700900888',
    normalizedPhone: '+447700900888',
    customFields: {
      category: 'VIP Patient',
      prescription: 'Amoxicillin 500mg',
      doctor: 'Dr. Evans',
    },
    verificationStatus: 'registered',
    waId: '447700900888@c.us',
  },
  {
    id: 'cust_03',
    name: 'Liam O\'Connor',
    rawPhone: '+353 87 123 4564',
    formattedPhone: '353871234564',
    normalizedPhone: '+353871234564',
    customFields: {
      category: 'Refill Due',
      prescription: 'Metformin 500mg',
      doctor: 'Dr. Kelly',
    },
    verificationStatus: 'unregistered',
    verificationError: 'Not registered on WhatsApp',
  },
  {
    id: 'cust_04',
    name: 'Sarah Jenkins',
    rawPhone: '+1 415-555-0122',
    formattedPhone: '14155550122',
    normalizedPhone: '+14155550122',
    customFields: {
      category: 'Wellness VIP',
      prescription: 'Vitamin D3 50000 IU',
      doctor: 'Dr. Adams',
    },
    verificationStatus: 'registered',
    waId: '14155550122@c.us',
  },
  {
    id: 'cust_05',
    name: 'Kenji Takahashi',
    rawPhone: '+81 90 1234 5678',
    formattedPhone: '819012345678',
    normalizedPhone: '+81901234567',
    customFields: {
      category: 'Chronic Care',
      prescription: 'Amlodipine 10mg',
      doctor: 'Dr. Sato',
    },
    verificationStatus: 'unverified',
  },
  {
    id: 'cust_06',
    name: 'Chloe Dubois',
    rawPhone: '+33 6 12 34 56 78',
    formattedPhone: '33612345678',
    normalizedPhone: '+33612345678',
    customFields: {
      category: 'Dermatology',
      prescription: 'Retin-A 0.05%',
      doctor: 'Dr. Moreau',
    },
    verificationStatus: 'registered',
    waId: '33612345678@c.us',
  },
]

/**
 * Comprehensive hook for CustomersView component
 * Manages contacts list, filters, selection, verification, add modal, export
 */
export function useCustomerManager(campaignContacts: Contact[], sessions: WABridgeSession[]) {
  // Merge unique contacts
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const existingIds = new Set(DEFAULT_CONTACTS.map((c) => c.formattedPhone))
    const additional = campaignContacts.filter((c) => !existingIds.has(c.formattedPhone))
    return [...DEFAULT_CONTACTS, ...additional]
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'unregistered' | 'unverified'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Selection
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCategory, setNewCategory] = useState('Chronic Care')
  const [newPrescription, setNewPrescription] = useState('')

  // Extract unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(contacts.map((c) => c.customFields?.category || 'General')))
  }, [contacts])

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.rawPhone.includes(searchQuery) ||
        c.formattedPhone.includes(searchQuery) ||
        (c.customFields?.prescription &&
          c.customFields.prescription.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || c.verificationStatus === statusFilter
      const matchesCategory = categoryFilter === 'all' || c.customFields?.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [contacts, searchQuery, statusFilter, categoryFilter])

  // Toggle select all/none
  const toggleSelectAll = useCallback(() => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set())
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)))
    }
  }, [filteredContacts, selectedContactIds.size])

  // Toggle single contact selection
  const toggleSelectContact = useCallback((id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Verify single contact
  const handleVerifySingle = useCallback(
    async (contact: Contact) => {
      if (!sessions[0]) return
      setVerifyingId(contact.id)

      try {
        // TODO: Implement actual WABridge verification
        // Simulate verification for now
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const isRegistered = Math.random() > 0.2 // 80% success rate

        setContacts((prev) =>
          prev.map((c) => {
            if (c.id === contact.id) {
              return {
                ...c,
                verificationStatus: isRegistered ? 'registered' : 'unregistered',
                waId: isRegistered ? `${contact.formattedPhone}@c.us` : undefined,
                verificationError: isRegistered ? undefined : 'Not registered on WhatsApp',
                verifiedAt: Date.now(),
              }
            }
            return c
          })
        )
      } catch (e) {
        console.error(e)
      } finally {
        setVerifyingId(null)
      }
    },
    [sessions]
  )

  // Add new contact
  const handleAddContact = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newName || !newPhone) return

      const clean = newPhone.replace(/\D/g, '')
      const newContact: Contact = {
        id: `cust_${Date.now()}`,
        name: newName,
        rawPhone: newPhone,
        formattedPhone: clean,
        normalizedPhone: `+${clean}`,
        customFields: {
          category: newCategory,
          prescription: newPrescription || 'Standard Care',
        },
        verificationStatus: 'unverified',
      }

      setContacts((prev) => [newContact, ...prev])
      setIsAddModalOpen(false)
      setNewName('')
      setNewPhone('')
      setNewPrescription('')
    },
    [newName, newPhone, newCategory, newPrescription]
  )

  // Export to CSV
  const handleExportCsv = useCallback(() => {
    const rows = filteredContacts.map((c, i) => ({
      Index: i + 1,
      Name: c.name,
      Phone: c.rawPhone,
      FormattedPhone: c.formattedPhone,
      VerificationStatus: c.verificationStatus,
      WhatsAppJID: c.waId || '',
      Category: c.customFields?.category || '',
      Prescription: c.customFields?.prescription || '',
      Doctor: c.customFields?.doctor || '',
    }))

    const headers = Object.keys(rows[0] || {}).join(',')
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers,
        ...rows.map((r) =>
          Object.values(r)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `pharmacy_patients_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [filteredContacts])

  // Get selected contacts
  const selectedContacts = useMemo(() => {
    return contacts.filter((c) => selectedContactIds.has(c.id))
  }, [contacts, selectedContactIds])

  return {
    // Contact list
    contacts,
    setContacts,
    filteredContacts,
    categories,

    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,

    // Selection
    selectedContactIds,
    selectedContacts,
    toggleSelectAll,
    toggleSelectContact,

    // Verification
    verifyingId,
    handleVerifySingle,

    // Add modal
    isAddModalOpen,
    setIsAddModalOpen,
    newName,
    setNewName,
    newPhone,
    setNewPhone,
    newCategory,
    setNewCategory,
    newPrescription,
    setNewPrescription,
    handleAddContact,

    // Export
    handleExportCsv,
  }
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useCustomerManager instead
 */
export function useCustomers(contacts: Contact[]) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactVerificationStatus | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = contacts.filter((c) => {
    if (statusFilter !== 'all' && c.verificationStatus !== statusFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.rawPhone.includes(search)) return false
    return true
  })

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((c) => c.id)))
  }, [filtered])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const selectedContacts = contacts.filter((c) => selectedIds.has(c.id))

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtered,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedContacts,
  }
}
