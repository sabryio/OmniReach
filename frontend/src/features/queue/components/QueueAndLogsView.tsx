/**
 * QueueAndLogsView — 4-sub-tab: Queue / Events / Analytics / Logs
 * Placeholder
 */
import type { QueueItem, LogEntry, SchedulerState } from '@/types'
import { useQueue } from '../hooks/useQueue'

interface QueueAndLogsViewProps {
  queue: QueueItem[]
  logs: LogEntry[]
  schedulerState: SchedulerState
  onClearLogs: () => void
}

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-success/20 text-success',
  sending: 'bg-primary/20 text-primary',
  pending: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/20 text-destructive',
  held_rate_limit: 'bg-warning/20 text-warning',
  held_time_window: 'bg-warning/20 text-warning',
  cancelled: 'bg-muted text-muted-foreground',
  skipped_unregistered: 'bg-destructive/20 text-destructive',
  verifying: 'bg-info/20 text-info-foreground',
}

const LOG_STYLE: Record<string, string> = {
  info: 'text-info-foreground',
  warn: 'text-warning',
  error: 'text-destructive',
  success: 'text-success',
}

type SubTab = 'queue' | 'events' | 'analytics' | 'logs'
const SUB_TABS: SubTab[] = ['queue', 'events', 'analytics', 'logs']

export function QueueAndLogsView({
  queue,
  logs,
  schedulerState,
  onClearLogs,
}: QueueAndLogsViewProps) {
  const {
    subTab, setSubTab,
    queueFilter, setQueueFilter,
    logFilter, setLogFilter,
    queueSearch, setQueueSearch,
    filteredQueue,
    filteredLogs,
  } = useQueue(queue, logs)

  const QUEUE_FILTERS = ['all', 'pending', 'sending', 'sent', 'held_rate_limit', 'failed', 'cancelled'] as const

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-lg font-bold text-foreground">Queue & Logs</h1>

      {/* Sub-tabs */}
      <div className="flex items-center gap-0 border-b border-border">
        {SUB_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
              subTab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'queue' ? `Queue (${schedulerState.totalQueuePending})` : t}
          </button>
        ))}
      </div>

      {/* Queue tab */}
      {subTab === 'queue' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search recipient, phone..."
              className="flex-1 min-w-40 bg-input border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex flex-wrap gap-1">
              {QUEUE_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border capitalize transition-colors ${
                    queueFilter === f
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Status', 'Recipient', 'Phone', 'Campaign', 'Session', 'Attempts'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No queue items</td>
                  </tr>
                ) : (
                  filteredQueue.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] capitalize ${STATUS_STYLE[q.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {q.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-foreground">{q.recipientName ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{q.phone}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-32">{q.campaignTitle}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{q.assignedSessionId ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{q.attempts}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events tab — placeholder */}
      {subTab === 'events' && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          Real-time event stream — coming soon
        </div>
      )}

      {/* Analytics tab — placeholder */}
      {subTab === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: logs.length },
            { label: 'Errors', value: logs.filter((l) => l.level === 'error').length },
            { label: 'Warnings', value: logs.filter((l) => l.level === 'warn').length },
            { label: 'Successful', value: logs.filter((l) => l.level === 'success').length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Logs tab */}
      {subTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'info', 'warn', 'error', 'success'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border capitalize transition-colors ${
                    logFilter === f
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={onClearLogs}
              className="ml-auto text-xs px-2 py-1 rounded bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No log entries</div>
            ) : (
              <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredLogs.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 px-4 py-2 hover:bg-muted/20">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`shrink-0 uppercase text-[10px] font-bold ${LOG_STYLE[l.level]}`}>
                      {l.level}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[10px]">[{l.category}]</span>
                    <span className="text-foreground">{l.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
