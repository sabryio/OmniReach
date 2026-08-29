import { useState, useCallback } from 'react'
import type { MessageTemplate } from '@/types'

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 't1',
    title: 'Prescription Ready',
    titleAr: 'الوصفة الطبية جاهزة',
    category: 'pharmacy',
    text: 'Hello {{name}}! Your prescription for {{prescription}} is ready for pickup.',
    textAr: 'مرحباً {{name}}! وصفتك الطبية لدواء {{prescription}} جاهزة للاستلام.',
    suggestedVariables: ['name', 'prescription', 'doctor'],
    createdAt: Date.now(),
  },
  {
    id: 't2',
    title: 'Appointment Reminder',
    category: 'medical',
    text: 'Dear {{name}}, reminder: you have an appointment on {{date}} with {{doctor}}.',
    suggestedVariables: ['name', 'date', 'doctor'],
    createdAt: Date.now(),
  },
]

export function useTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<MessageTemplate>>({})

  const selected = templates.find((t) => t.id === selectedId) ?? null

  const newTemplate = useCallback(() => {
    setSelectedId(null)
    setDraft({ suggestedVariables: [] })
    setIsEditing(true)
  }, [])

  const editTemplate = useCallback((t: MessageTemplate) => {
    setSelectedId(t.id)
    setDraft(t)
    setIsEditing(true)
  }, [])

  const saveTemplate = useCallback(() => {
    if (!draft.title || !draft.text) return
    if (selectedId) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === selectedId ? { ...t, ...draft, updatedAt: Date.now() } : t)),
      )
    } else {
      setTemplates((prev) => [
        ...prev,
        { ...draft, id: `t_${Date.now()}`, createdAt: Date.now(), suggestedVariables: [] } as MessageTemplate,
      ])
    }
    setIsEditing(false)
    setDraft({})
  }, [draft, selectedId])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  return {
    templates,
    selected,
    selectedId,
    setSelectedId,
    isEditing,
    setIsEditing,
    draft,
    setDraft,
    newTemplate,
    editTemplate,
    saveTemplate,
    deleteTemplate,
  }
}
