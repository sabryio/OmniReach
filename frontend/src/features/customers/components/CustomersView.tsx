/**
 * CustomersView — contacts management list
 * Placeholder
 */
import type { Contact, WABridgeSession, WABridgeConfig } from '@/types'
import { useCustomers } from '../hooks/useCustomers'

interface CustomersViewProps {
  campaignContacts: Contact[]
  sessions: WABridgeSession[]
  config: WABridgeConfig
  onLaunchCampaignWithContacts: (contacts: Contact[]) => void
  onOpenVerifier: () => void
}

const STATUS_FILTERS = ['all', 'registered', 'unregistered', 'unverified'] as const

const STATUS_STYLE: Record<string, string> = {
  registered: 'bg-success/20 text-success',
  unregistered: 'bg-destructive/20 text-destructive',
  unverified: 'bg-muted text-muted-foreground',
  checking: 'bg-info/20 text-info-foreground',
  error: 'bg-destructive/20 text-destructive',
}

export function CustomersView({
  campaignContacts,
  onLaunchCampaignWithContacts,
  onOpenVerifier,
}: CustomersViewProps) {
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    filtered,
    selectedIds, toggleSelect, selectAll, clearSelection,
    selectedContacts,
  } = useCustomers(campaignContacts)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-foreground">Customers</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="flex-1 min-w-48 bg-input border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-[11px] px-2 py-1 rounded-full border capitalize transition-colors ${
                statusFilter === f
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={onOpenVerifier}
          className="text-xs px-3 py-1.5 rounded bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          ☏ Verify All
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2 text-left w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                  className="accent-primary"
                />
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Name</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Phone</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Category</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">WA Status</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">waId</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No contacts found
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-3 py-2 text-foreground font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono">{c.rawPhone}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.customFields['category'] ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLE[c.verificationStatus] ?? ''}`}>
                      {c.verificationStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{c.waId ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border transition-colors">
                      Re-verify
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-xs text-primary font-medium">{selectedIds.size} contacts selected</span>
          <button
            onClick={() => onLaunchCampaignWithContacts(selectedContacts)}
            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            🚀 Launch Campaign with Selected
          </button>
        </div>
      )}
    </div>
  )
}
