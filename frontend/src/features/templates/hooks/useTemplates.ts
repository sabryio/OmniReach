import { useState, useCallback, useMemo, useRef } from 'react'
import type { MessageTemplate } from '@/types'

/**
 * Comprehensive hook for TemplatesView component.
 * Receives templates as a parameter — NO default data inside this hook.
 * All default/initial data must come from the route via useTemplatesQuery.
 */
export function useTemplateManager(initialTemplates: MessageTemplate[]) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplates[0]?.id ?? '',
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Selected template
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )

  // Filtered templates
  const filteredTemplates = useMemo(
    () =>
      templates.filter((tmpl) => {
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
      }),
    [templates, selectedCategory, searchQuery],
  )

  const handleCopyText = useCallback((tmpl: MessageTemplate) => {
    navigator.clipboard.writeText(tmpl.text)
    setCopiedId(tmpl.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

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

  const handleOpenEditModal = useCallback((tmpl: MessageTemplate) => {
    setUploadError(null)
    setEditingTemplate({ ...tmpl })
    setIsEditorOpen(true)
  }, [])

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
        prev ? { ...prev, imageUrl: dataUrl, imageFileName: file.name } : null,
      )
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveImage = useCallback(() => {
    setEditingTemplate((prev) =>
      prev ? { ...prev, imageUrl: undefined, imageFileName: undefined } : null,
    )
  }, [])

  const handleInsertVariable = useCallback((varName: string) => {
    setEditingTemplate((prev) => {
      if (!prev) return null
      const currentText = prev.text ?? ''
      const tag = `{{${varName}}}`
      const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + tag + ' '
      const currentVars = prev.suggestedVariables ?? []
      return {
        ...prev,
        text: newText,
        suggestedVariables: currentVars.includes(varName) ? currentVars : [...currentVars, varName],
      }
    })
  }, [])

  const handleSaveTemplate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingTemplate?.title?.trim() || !editingTemplate?.text?.trim()) return

      const title = editingTemplate.title.trim()
      const text = editingTemplate.text.trim()
      const category = editingTemplate.category?.trim() ?? 'Custom'
      const imageUrl = editingTemplate.imageUrl?.trim() || undefined
      const imageFileName = editingTemplate.imageFileName || (imageUrl ? 'attached_image.jpg' : undefined)

      const detectedVars: string[] = []
      for (const match of text.matchAll(/\{\{([a-zA-Z0-9_-]+)\}\}/g)) {
        if (match[1] && !detectedVars.includes(match[1])) detectedVars.push(match[1])
      }

      if (editingTemplate.id) {
        const updated: MessageTemplate = {
          id: editingTemplate.id,
          title,
          category,
          text,
          imageUrl,
          imageFileName,
          suggestedVariables:
            detectedVars.length > 0 ? detectedVars : editingTemplate.suggestedVariables ?? ['name'],
          updatedAt: Date.now(),
          createdAt: editingTemplate.createdAt ?? Date.now(),
        }
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        setSelectedTemplateId(updated.id)
      } else {
        const created: MessageTemplate = {
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
        setTemplates((prev) => [created, ...prev])
        setSelectedTemplateId(created.id)
      }

      setIsEditorOpen(false)
      setEditingTemplate(null)
    },
    [editingTemplate],
  )

  const handleDeleteTemplate = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation()
      const target = templates.find((t) => t.id === id)
      if (!target) return
      if (window.confirm(`Delete template "${target.title}"?`)) {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
        if (selectedTemplateId === id) {
          const remaining = templates.filter((t) => t.id !== id)
          setSelectedTemplateId(remaining[0]?.id ?? '')
        }
      }
    },
    [templates, selectedTemplateId],
  )

  const handleDuplicateTemplate = useCallback((tmpl: MessageTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const duplicate: MessageTemplate = {
      ...tmpl,
      id: `tmpl_${Date.now()}_copy`,
      title: `${tmpl.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setTemplates((prev) => [duplicate, ...prev])
    setSelectedTemplateId(duplicate.id)
  }, [])

  const handleResetToDefaults = useCallback(
    (defaults: MessageTemplate[]) => {
      if (window.confirm('Restore standard default templates?')) {
        setTemplates(defaults)
        setSelectedTemplateId(defaults[0]?.id ?? '')
      }
    },
    [],
  )

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
    // Copy
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
 * Legacy read-only hook — kept for backward compatibility.
 * @deprecated Use useTemplateManager instead.
 */
export function useTemplates() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  return { selectedId, setSelectedId }
}
