import { useState, useCallback } from 'react'
import type { WABridgeSession, WABridgeConfig, ThemeMode, ThemeColor, SchedulerState } from '@/types'

/**
 * Modal visibility management hook
 */
export function useModals() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isVerifierOpen, setIsVerifierOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)

  return {
    isSettingsOpen,
    isVerifierOpen,
    isAboutOpen,
    openSettings: useCallback(() => setIsSettingsOpen(true), []),
    closeSettings: useCallback(() => setIsSettingsOpen(false), []),
    openVerifier: useCallback(() => setIsVerifierOpen(true), []),
    closeVerifier: useCallback(() => setIsVerifierOpen(false), []),
    openAbout: useCallback(() => setIsAboutOpen(true), []),
    closeAbout: useCallback(() => setIsAboutOpen(false), []),
  }
}

/**
 * Comprehensive hook for SettingsModal component
 * Manages tabs, form state, theme settings, scheduler debug
 */
export function useSettings(
  config: WABridgeConfig,
  schedulerState: SchedulerState,
  themeMode: ThemeMode,
  themeColor: ThemeColor,
  onSaveConfig: (config: WABridgeConfig) => void,
  onSetThemeColor: (color: ThemeColor) => void,
  onToggleThemeMode: () => void,
  onSetStrictTimeWindow: (strict: boolean) => void,
  onSetSimulatedHourOffset: (offset: number) => void,
  onClearAllData: () => void
) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'wabridge' | 'schedule' | 'system'>('appearance')
  const [localConfig, setLocalConfig] = useState<WABridgeConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  // Update local config field
  const updateConfigField = useCallback(
    <K extends keyof WABridgeConfig>(key: K, value: WABridgeConfig[K]) => {
      setLocalConfig((prev) => ({ ...prev, [key]: value }))
      setHasChanges(true)
    },
    []
  )

  // Save settings
  const handleSave = useCallback(() => {
    onSaveConfig(localConfig)
    setHasChanges(false)
  }, [localConfig, onSaveConfig])

  // Cancel/reset
  const handleCancel = useCallback(() => {
    setLocalConfig(config)
    setHasChanges(false)
  }, [config])

  // Copy to clipboard
  const handleCopyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }, [])

  // Clear all data with confirmation
  const handleClearAllDataConfirm = useCallback(() => {
    if (window.confirm('Clear all campaigns, queue items, and logs? This cannot be undone.')) {
      onClearAllData()
    }
  }, [onClearAllData])

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Form state
    localConfig,
    setLocalConfig,
    updateConfigField,
    hasChanges,

    // Theme
    themeMode,
    themeColor,
    onSetThemeColor,
    onToggleThemeMode,

    // Scheduler debug
    schedulerState,
    onSetStrictTimeWindow,
    onSetSimulatedHourOffset,

    // Actions
    handleSave,
    handleCancel,
    handleCopyToClipboard,
    handleClearAllDataConfirm,
    showCopied,
  }
}

/**
 * Quick verifier hook
 */
interface VerifyResult {
  isRegistered: boolean
  phone: string
  waId?: string
  error?: string
  timestamp: number
}

export function useQuickVerifier(sessions: WABridgeSession[], _config: WABridgeConfig) {
  const [phone, setPhone] = useState('')
  const [selectedSession, setSelectedSession] = useState(sessions[0]?.id ?? '')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const check = useCallback(async () => {
    if (!phone.trim() || !selectedSession) return
    setIsChecking(true)
    setResult(null)

    // Placeholder: mock result
    await new Promise((r) => setTimeout(r, 800))
    const isRegistered = !phone.trim().endsWith('4')

    setResult({
      isRegistered,
      phone: phone.trim(),
      waId: isRegistered ? `${phone.replace(/\D/g, '')}@c.us` : undefined,
      error: isRegistered ? undefined : 'Number not registered on WhatsApp',
      timestamp: Date.now(),
    })

    setIsChecking(false)
  }, [phone, selectedSession])

  return { phone, setPhone, selectedSession, setSelectedSession, result, isChecking, check }
}
