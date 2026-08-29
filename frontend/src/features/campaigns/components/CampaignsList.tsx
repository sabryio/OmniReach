/**
 * CampaignsList — master-detail split pane
 * Placeholder
 */
import type { Campaign, QueueItem, WABridgeSession } from '@/types'
import { useCampaigns } from '../hooks/useCampaigns'

interface CampaignsListProps {
  campaigns: Campaign[]
  queue: QueueItem[]
  sessions: WABridgeSession[]
  onPauseCampaign: (id: string) => void
  onResumeCampaign: (id: string) => void
  onCancelCampaign: (id: string) => void
  onRetryFailed: (id: string) => void
  onDeleteCampaign: (id: string) => void
  onArchiveCampaign: (id: string) => void
  onUnarchiveCampaign: (id: string) => void
  onNewCampaignClick: () => void
}

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-success/20 text-success',
  paused: 'bg-warning/20 text-warning',
  completed: 'bg-info/20 text-info-foreground',
  draft: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
}

export function CampaignsList({
  campaigns,
  onPauseCampaign,
  onResumeCampaign,
  onCancelCampaign,
  onDeleteCampaign,
  onArchiveCampaign,
  onUnarchiveCampaign,
  onNewCampaignClick,
}: CampaignsListProps) {
  const {
    selected, setSelectedId,
    statusFilter, setStatusFilter,
    showArchived, setShowArchived,
    search, setSearch,
    filtered,
  } = useCampaigns(campaigns)

  const FILTERS = ['all', 'running', 'paused', 'completed', 'draft'] as const

  return (
    <div className="flex gap-4 h-full">
      {/* Left pane */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`text-xs px-2 py-1 rounded transition-colors ${!showArchived ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`text-xs px-2 py-1 rounded transition-colors ${showArchived ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Archived
            </button>
          </div>
          <button
            onClick={onNewCampaignClick}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns..."
          className="w-full bg-input border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Status filters */}
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors capitalize ${
                statusFilter === f
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <ul className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <li className="text-xs text-muted-foreground text-center py-6">No campaigns found</li>
          ) : (
            filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selected?.id === c.id
                      ? 'bg-accent border-primary/40'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-foreground truncate">{c.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 capitalize ${STATUS_COLORS[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${c.totalContacts > 0 ? Math.round((c.sentCount / c.totalContacts) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {c.sentCount}/{c.totalContacts} sent
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Right pane — detail */}
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select a campaign to view details
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Detail header */}
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">{selected.title}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{selected.id}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full capitalize shrink-0 ${STATUS_COLORS[selected.status] ?? ''}`}>
                {selected.status}
              </span>
            </div>

            {/* Action toolbar */}
            <div className="px-5 py-2 border-b border-border flex items-center gap-2 flex-wrap">
              {selected.status === 'running' && (
                <button onClick={() => onPauseCampaign(selected.id)} className="text-xs px-2 py-1 rounded bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 transition-colors">⏸ Pause</button>
              )}
              {selected.status === 'paused' && (
                <button onClick={() => onResumeCampaign(selected.id)} className="text-xs px-2 py-1 rounded bg-success/20 text-success border border-success/30 hover:bg-success/30 transition-colors">▶ Resume</button>
              )}
              <button onClick={() => onCancelCampaign(selected.id)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">✕ Cancel</button>
              {selected.isArchived
                ? <button onClick={() => onUnarchiveCampaign(selected.id)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">↑ Unarchive</button>
                : <button onClick={() => onArchiveCampaign(selected.id)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">↓ Archive</button>
              }
              <button onClick={() => onDeleteCampaign(selected.id)} className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors ml-auto">🗑 Delete</button>
            </div>

            {/* Metrics */}
            <div className="px-5 py-4 grid grid-cols-4 gap-3 border-b border-border">
              {[
                { label: 'Total', value: selected.totalContacts },
                { label: 'Sent', value: selected.sentCount },
                { label: 'Unregistered', value: selected.unregisteredCount },
                { label: 'Failed', value: selected.failedCount },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold font-mono text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                </div>
              ))}
            </div>

            {/* Template preview */}
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Template</p>
              <p className="text-xs text-foreground bg-muted/30 rounded p-3 border border-border">{selected.templateText}</p>
            </div>

            {/* Contacts table */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recipients ({selected.contacts.length})</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Name</th>
                    <th className="text-left pb-2 font-medium">Phone</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selected.contacts.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5 text-foreground">{c.name}</td>
                      <td className="py-1.5 text-muted-foreground font-mono">{c.rawPhone}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] capitalize ${
                          c.verificationStatus === 'registered' ? 'bg-success/20 text-success'
                          : c.verificationStatus === 'unregistered' ? 'bg-destructive/20 text-destructive'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {c.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
