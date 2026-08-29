/**
 * AppFooter — 24px bottom status strip
 * Placeholder: log tail on left + queue count + version on right
 */
import type { LogEntry, SchedulerState } from '@/types'

interface AppFooterProps {
  logs: LogEntry[]
  schedulerState: SchedulerState
}

export function AppFooter({ logs, schedulerState }: AppFooterProps) {
  const latest = logs[0]

  return (
    <footer className="h-6 bg-card border-t border-border px-3 flex items-center justify-between shrink-0 text-[10px] select-none z-30 font-mono text-muted-foreground">
      {/* Left: latest log entry */}
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="text-muted-foreground uppercase font-bold tracking-wider shrink-0 text-[9px]">
          Dispatcher:
        </span>
        <span className="truncate">
          {latest
            ? `[${new Date(latest.timestamp).toLocaleTimeString()}] ${latest.category}: ${latest.message}`
            : 'Daemon active on 127.0.0.1:8080 • Rate quota ready'}
        </span>
      </div>

      {/* Right: queue count + version */}
      <div className="flex items-center gap-3 shrink-0">
        <span>{schedulerState.totalQueuePending} in queue</span>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5 text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>OmniReach v0.1</span>
        </div>
      </div>
    </footer>
  )
}
