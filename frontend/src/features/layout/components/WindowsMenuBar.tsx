/**
 * WindowsMenuBar — 28px menu bar below title bar
 * Placeholder: File | Campaign | View | Tools | Help dropdowns
 */
import { useState } from 'react'

interface WindowsMenuBarProps {
  isSchedulerRunning: boolean
  compactMode: boolean
  onNewCampaign: () => void
  onImportCsv: () => void
  onExportReport: () => void
  onOpenSettings: () => void
  onOpenVerifier: () => void
  onOpenAbout: () => void
  onNavigate: (tab: string) => void
  onToggleScheduler: () => void
  onClearQueue: () => void
  onResetSessionLimits: () => void
  onClearLogs: () => void
  onToggleCompactMode: () => void
}

const MENUS = ['File', 'Campaign', 'View', 'Tools', 'Help'] as const
type Menu = (typeof MENUS)[number]

export function WindowsMenuBar({
  isSchedulerRunning,
  compactMode,
  onNewCampaign,
  onExportReport,
  onOpenSettings,
  onOpenVerifier,
  onOpenAbout,
  onNavigate,
  onToggleScheduler,
  onClearQueue,
  onResetSessionLimits,
  onClearLogs,
  onToggleCompactMode,
}: WindowsMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<Menu | null>(null)

  const toggle = (menu: Menu) => setOpenMenu((p) => (p === menu ? null : menu))
  const close = () => setOpenMenu(null)

  const item = (label: string, shortcut: string, action: () => void) => (
    <button
      key={label}
      onClick={() => { action(); close() }}
      className="w-full flex items-center justify-between gap-8 px-3 py-1 text-left text-xs hover:bg-accent hover:text-accent-foreground rounded transition-colors"
    >
      <span>{label}</span>
      <span className="text-muted-foreground font-mono text-[10px]">{shortcut}</span>
    </button>
  )

  const separator = () => <div key={Math.random()} className="my-1 border-t border-border" />

  const menuItems: Record<Menu, React.ReactNode[]> = {
    File: [
      item('New Campaign', 'Ctrl+N', onNewCampaign),
      item('Import CSV', 'Ctrl+I', onNewCampaign),
      separator(),
      item('Export Report', 'Ctrl+E', onExportReport),
      separator(),
      item('Settings', 'Ctrl+,', onOpenSettings),
    ],
    Campaign: [
      item(isSchedulerRunning ? 'Pause Dispatcher' : 'Start Dispatcher', 'Space', onToggleScheduler),
      separator(),
      item('View Campaigns', 'Alt+2', () => onNavigate('campaigns')),
      item('Verify Contacts', 'F2', onOpenVerifier),
      separator(),
      item('Clear Completed Queue', '', onClearQueue),
    ],
    View: [
      item('Dashboard', 'Alt+1', () => onNavigate('dashboard')),
      item('Campaigns', 'Alt+2', () => onNavigate('campaigns')),
      item('Customers', 'Alt+3', () => onNavigate('customers')),
      item('Templates', 'Alt+4', () => onNavigate('templates')),
      item('Sessions', 'Alt+5', () => onNavigate('sessions')),
      item('Queue & Logs', 'Alt+6', () => onNavigate('queue')),
      item('Reports', 'Alt+7', () => onNavigate('reports')),
      separator(),
      item(compactMode ? 'Comfortable Mode' : 'Compact Mode', 'Ctrl+D', onToggleCompactMode),
    ],
    Tools: [
      item('Phone Verifier', 'F2', onOpenVerifier),
      separator(),
      item('Reset Session Limits', '', onResetSessionLimits),
      item('Clear Logs', '', onClearLogs),
    ],
    Help: [
      item('SOP Guide', 'F1', onOpenAbout),
      separator(),
      item('About OmniReach', '', onOpenAbout),
    ],
  }

  return (
    <div className="h-7 bg-card border-b border-border flex items-center px-1 gap-0.5 shrink-0 text-xs z-30 relative select-none">
      {MENUS.map((menu) => (
        <div key={menu} className="relative">
          <button
            onClick={() => toggle(menu)}
            className={`px-3 h-6 rounded text-xs transition-colors ${
              openMenu === menu
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {menu}
          </button>

          {openMenu === menu && (
            <>
              {/* backdrop */}
              <div className="fixed inset-0 z-40" onClick={close} />
              <div className="absolute top-full left-0 mt-0.5 w-52 bg-popover border border-border rounded-md shadow-lg z-50 py-1 px-1">
                {menuItems[menu]}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Right: keyboard hint */}
      <div className="ml-auto mr-2 text-muted-foreground text-[10px] font-mono hidden lg:block">
        Ctrl+N New  •  Space Dispatch  •  F2 Verify
      </div>
    </div>
  )
}
