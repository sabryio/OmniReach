import { useState, useCallback } from 'react'
import type { WABridgeSession, WABridgeConfig } from '@/types'

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
