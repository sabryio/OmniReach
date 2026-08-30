import { useState, useCallback } from 'react'
import type { ThemeColor, ThemeMode } from '@/types'

export function useLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [compactMode, setCompactMode] = useState(true)
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue')

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((p) => !p), [])
  const toggleCompactMode = useCallback(() => setCompactMode((p) => !p), [])
  const toggleThemeMode = useCallback(
    () => setThemeMode((p) => (p === 'dark' ? 'light' : 'dark')),
    [],
  )

  return {
    isSidebarCollapsed,
    toggleSidebar,
    compactMode,
    toggleCompactMode,
    themeMode,
    themeColor,
    setThemeColor,
    toggleThemeMode,
  }
}
