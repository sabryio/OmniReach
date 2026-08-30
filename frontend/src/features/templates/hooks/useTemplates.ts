import { useState, useCallback, useMemo, useRef } from 'react'
import type { MessageTemplate } from '@/types'

// Default templates constant
const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl_001',
    title: 'Prescription Ready for Pickup',
    category: 'Pharmacy',
    text: 'Hello {{name}}, your prescription for {{prescription}} is ready for pickup at our pharmacy. Please bring your ID.',
    imageUrl: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'prescription_ready.jpg',
    suggestedVariables: ['name', 'prescription'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'tmpl_002',
    title: 'Lab Results Available',
    category: 'Lab Results',
    text: 'Dear {{name}}, your lab results are now available. Please visit us during business hours or log into the patient portal at {{portal_url}}.',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'lab_results.jpg',
    suggestedVariables: ['name', 'portal_url'],
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'tmpl_003',
    title: 'Flu Vaccine Reminder',
    category: 'Vaccination',
    text: 'Hi {{name}}, flu season is here! Protect yourself and your family with our flu vaccine. Book your appointment today at {{pharmacy}}.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'flu_vaccine.jpg',
    suggestedVariables: ['name', 'pharmacy'],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'tmpl_004',
    title: 'VIP Membership Benefits',
    category: 'VIP Care',
    text: 'Exclusive offer for {{name}}! As a VIP member, enjoy 20% off all purchases this month. Visit us at {{pharmacy}} to claim your rewards.',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80',
    imageFileName: 'vip_benefits.jpg',
    suggestedVariables: ['name', 'pharmacy'],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'tmpl_005',
    title: 'Refill Reminder',
    category: 'Refill Reminder',
    text: 'Hello {{name}}, it\'s time to refill your {{prescription}}. Call us or order online for convenient pickup or delivery.',
    suggestedVariables: ['name', 'prescription'],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
]

/**
 * Comprehensive hook for TemplatesView component
 * Manages templates CRUD, filters, selection, editor modal, image upload
 */
export function useTemplateManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Selected template
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0] || null
  }, [templates, selectedTemplateId])

  // Filtered templates based on category & search
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchesCat =
        selectedCategory === 'all' ||
        tmpl.category.toLowerCase() === selectedCategory.toLowerCase()

      if (!matchesCat) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        tmpl.title.toLowerCase().includes(q) ||
        tmpl.text.toLowerCase().includes(q) ||
        tmpl.category.toLowerCase().includes(q)
      )
    })
  }, [templates, selectedCategory, searchQuery])

  // Copy template text to clipboard
  const handleCopyText = useCallback((tmpl: MessageTemplate) => {
    navigator.clipboard.writeText(tmpl.text)
    setCopiedId(tmpl.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // Open create modal
  const handleOpenCreateModal = useCallback(() => {
    setUploadError(null)
    setEditingTemplate({
      title: '',
      category: 'Pharmacy',
      text: 'Hello {{name}}, your prescription for {{prescription}} is ready for pickup at our pharmacy.',
      imageUrl: '',
      imageFileName: '',
      suggestedVariables: ['name', 'prescription'],
    })
    setIsEditorOpen(true)
  }, [])

  // Open edit modal
  const handleOpenEditModal = useCallback((tmpl: MessageTemplate) => {
    setUploadError(null)
    setEditingTemplate({ ...tmpl })
    setIsEditorOpen(true)
  }, [])

  // Handle image file upload
  const handleImageFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must not exceed 5MB')
      return
    }

    setUploadError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setEditingTemplate((prev) =>
        prev
          ? {
            ...prev,
            imageUrl: dataUrl,
            imageFileName: file.name,
          }
          : null
      )
    }
    reader.readAsDataURL(file)
  }, [])

  // Remove image from template
  const handleRemoveImage = useCallback(() => {
    setEditingTemplate((prev) =>
      prev
        ? {
          ...prev,
          imageUrl: undefined,
          imageFileName: undefined,
        }
        : null
    )
  }, [])

  // Insert merge variable into template text
  const handleInsertVariable = useCallback((varName: string) => {
    setEditingTemplate((prev) => {
      if (!prev) return null
      const currentText = prev.text || ''
      const tag = `{{${varName}}}`
      const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + tag + ' '

      const currentVars = prev.suggestedVariables || []
      const newVars = currentVars.includes(varName) ? currentVars : [...currentVars, varName]

      return {
        ...prev,
        text: newText,
        suggestedVariables: newVars,
      }
    })
  }, [])

  // Save template (create or update)
  const handleSaveTemplate = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate?.title?.trim() || !editingTemplate?.text?.trim()) {
      return
    }

    const title = editingTemplate.title.trim()
    const text = editingTemplate.text.trim()
    const category = editingTemplate.category?.trim() || 'Custom'
    const imageUrl = editingTemplate.imageUrl?.trim() || undefined
    const imageFileName = editingTemplate.imageFileName || (imageUrl ? 'attached_image.jpg' : undefined)

    // Extract variables inside {{...}}
    const detectedVars: string[] = []
    const matches = text.matchAll(/\{\{([a-zA-Z0-9_-]+)\}\}/g)
    for (const match of matches) {
      if (match[1] && !detectedVars.includes(match[1])) {
        detectedVars.push(match[1])
      }
    }

    if (editingTemplate.id) {
      // Update existing
      const updatedTemplate: MessageTemplate = {
        id: editingTemplate.id,
        title,
        category,
        text,
        imageUrl,
        imageFileName,
        suggestedVariables:
          detectedVars.length > 0 ? detectedVars : editingTemplate.suggestedVariables || ['name'],
        updatedAt: Date.now(),
        createdAt: editingTemplate.createdAt || Date.now(),
      }

      setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))
      setSelectedTemplateId(updatedTemplate.id)
    } else {
      // Create new
      const createdTemplate: MessageTemplate = {
        id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        category,
        text,
        imageUrl,
        imageFileName,
        suggestedVariables: detectedVars.length > 0 ? detectedVars : ['name', 'prescription'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setTemplates((prev) => [createdTemplate, ...prev])
      setSelectedTemplateId(createdTemplate.id)
    }

    setIsEditorOpen(false)
    setEditingTemplate(null)
  }, [editingTemplate])

  // Delete template
  const handleDeleteTemplate = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      const target = templates.find((t) => t.id === id)
      if (!target) return

      if (window.confirm(`Are you sure you want to permanently delete template "${target.title}"?`)) {
        setTemplates((prev) => prev.filter((tmpl) => tmpl.id !== id))
        if (selectedTemplateId === id) {
          const next = templates.filter((tmpl) => tmpl.id !== id)
          setSelectedTemplateId(next.length > 0 ? next[0]?.id || '' : '')
        }
      }
    },
    [templates, selectedTemplateId]
  )

  // Duplicate template
  const handleDuplicateTemplate = useCallback(
    (tmpl: MessageTemplate, e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      const duplicate: MessageTemplate = {
        ...tmpl,
        id: `tmpl_${Date.now()}_copy`,
        title: `${tmpl.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setTemplates((prev) => [duplicate, ...prev])
      setSelectedTemplateId(duplicate.id)
    },
    []
  )

  // Reset to default templates
  const handleResetToDefaults = useCallback(() => {
    if (window.confirm('Restore standard default templates?')) {
      setTemplates(DEFAULT_TEMPLATES)
      setSelectedTemplateId(DEFAULT_TEMPLATES[0]?.id || '')
    }
  }, [])

  return {
    // Template list
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedTemplate,

    // Filters
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,

    // Copy state
    copiedId,
    handleCopyText,

    // Editor modal
    isEditorOpen,
    setIsEditorOpen,
    editingTemplate,
    setEditingTemplate,
    uploadError,
    setUploadError,
    fileInputRef,

    // Actions
    handleOpenCreateModal,
    handleOpenEditModal,
    handleImageFileUpload,
    handleRemoveImage,
    handleInsertVariable,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleDuplicateTemplate,
    handleResetToDefaults,
  }
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useTemplateManager instead
 */
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
        prev.map((t) => (t.id === selectedId ? { ...t, ...draft, updatedAt: Date.now() } : t))
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

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId]
  )

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
