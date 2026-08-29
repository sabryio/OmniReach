/**
 * WindowsSidebar — collapsible left nav (256px / 56px collapsed)
 * Placeholder: 9 nav items + utilities section + bottom controls
 */
interface WindowsSidebarProps {
  activeTab: string
  onNavigate: (tab: string) => void
  campaignsCount: number
  activeCampaignsCount: number
  customersCount: number
  templatesCount: number
  sessionsCount: number
  queuePendingCount: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  compactMode: boolean
  onToggleCompactMode: () => void
  onOpenVerifier: () => void
}

const NAV_ITEMS = [
  { id: 'dashboard',    icon: '⊞', label: 'Dashboard',      shortcut: 'Alt+1', badgeKey: null },
  { id: 'campaigns',   icon: '◫', label: 'Campaigns',       shortcut: 'Alt+2', badgeKey: 'campaigns' },
  { id: 'new_campaign',icon: '+', label: 'New Broadcast',   shortcut: 'Ctrl+N', badgeKey: null },
  { id: 'customers',   icon: '⚇', label: 'Customers',       shortcut: 'Alt+3', badgeKey: 'customers' },
  { id: 'templates',   icon: '☰', label: 'Templates',       shortcut: 'Alt+4', badgeKey: 'templates' },
  { id: 'sessions',    icon: '◉', label: 'Sessions',        shortcut: 'Alt+5', badgeKey: 'sessions' },
  { id: 'queue',       icon: '≋', label: 'Queue & Logs',    shortcut: 'Alt+6', badgeKey: 'queue' },
  { id: 'reports',     icon: '◈', label: 'Reports',         shortcut: 'Alt+7', badgeKey: null },
  { id: 'settings',    icon: '⚙', label: 'Settings',        shortcut: 'Ctrl+,', badgeKey: null },
] as const

export function WindowsSidebar({
  activeTab,
  onNavigate,
  campaignsCount,
  activeCampaignsCount,
  customersCount,
  templatesCount,
  sessionsCount,
  queuePendingCount,
  isCollapsed,
  onToggleCollapse,
  compactMode,
  onToggleCompactMode,
  onOpenVerifier,
}: WindowsSidebarProps) {
  const badges: Record<string, string | number | null> = {
    campaigns: activeCampaignsCount > 0 ? `${activeCampaignsCount} active` : campaignsCount || null,
    customers: customersCount || null,
    templates: templatesCount || null,
    sessions: `${sessionsCount} active`,
    queue: queuePendingCount > 0 ? queuePendingCount : null,
  }

  const py = compactMode ? 'py-1' : 'py-1.5'

  return (
    <aside
      className={`${
        isCollapsed ? 'w-14' : 'w-56'
      } bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-200 overflow-hidden`}
    >
      {/* Nav group label */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Navigation
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id
          const badge = item.badgeKey ? badges[item.badgeKey] : null

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? `${item.label} (${item.shortcut})` : item.shortcut}
              className={`w-full flex items-center gap-2.5 px-2 ${py} rounded-md text-sm transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className="text-base shrink-0 leading-none">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-mono shrink-0">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Utilities */}
      <div className="border-t border-sidebar-border px-1.5 py-2 space-y-0.5">
        <button
          onClick={onOpenVerifier}
          title="Phone Validator (F2)"
          className={`w-full flex items-center gap-2.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span>☏</span>
          {!isCollapsed && <span>Phone Validator</span>}
          {!isCollapsed && <span className="ml-auto font-mono text-[10px]">F2</span>}
        </button>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-sidebar-border px-1.5 py-2 space-y-1">
        {!isCollapsed && (
          <label className="flex items-center gap-2 px-2 py-1 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={compactMode}
              onChange={onToggleCompactMode}
              className="accent-primary w-3 h-3"
            />
            Compact Mode
          </label>
        )}

        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}>‹</span>
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
