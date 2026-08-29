import { useState, useCallback } from 'react'
import type { Contact, ContactVerificationStatus } from '@/types'

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
    search, setSearch,
    statusFilter, setStatusFilter,
    filtered,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedContacts,
  }
}
