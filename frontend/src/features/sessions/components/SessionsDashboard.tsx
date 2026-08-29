/**
 * SessionsDashboard — WhatsApp session management
 * Placeholder
 */
import type { WABridgeSession, WABridgeConfig } from '@/types'
import { useSessions } from '../hooks/useSessions'

interface SessionsDashboardProps {
  sessions: WABridgeSession[]
  config: WABridgeConfig
  onResetSessionLimits: (id: string) => void
  onUpdateSessions: (sessions: WABridgeSession[]) => void
}

const STATUS_STYLE: Record<string, string> = {
  connected: 'bg-success/20 text-success',
  disconnected: 'bg-destructive/20 text-destructive',
  connecting: 'bg-warning/20 text-warning',
  qr_required: 'bg-info/20 text-info-foreground',
}

export function SessionsDashboard({
  sessions,
  config,
  onResetSessionLimits,
  onUpdateSessions,
}: SessionsDashboardProps) {
  const { testPhone, setTestPhone, testResults, resetLimits, testVerify } =
    useSessions(sessions, config, onResetSessionLimits, onUpdateSessions)

  return (
    <div className="space-y-4">
      {/* Header + global test input */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-foreground">Sessions</h1>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Test phone number..."
            className="bg-input border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
          />
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          No sessions configured. Add sessions in Settings.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((s) => {
            const hourlyUsed = s.hourlySentTimestamps.length
            const dailyUsed = s.dailySentTimestamps.length
            const hourlyPct = Math.min(Math.round((hourlyUsed / s.hourlyLimit) * 100), 100)
            const dailyPct = Math.min(Math.round((dailyUsed / s.dailyLimit) * 100), 100)

            return (
              <div key={s.id} className="bg-card border border-border rounded-lg p-4 space-y-4">
                {/* Session header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.phoneNumber ?? '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[s.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Quota bars */}
                <div className="space-y-2">
                  {/* Hourly */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Hourly</span>
                      <span className="font-mono text-foreground">{hourlyUsed}/{s.hourlyLimit}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${hourlyPct >= 100 ? 'bg-destructive' : hourlyPct >= 80 ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${hourlyPct}%` }}
                      />
                    </div>
                  </div>
                  {/* Daily */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Daily</span>
                      <span className="font-mono text-foreground">{dailyUsed}/{s.dailyLimit}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${dailyPct >= 100 ? 'bg-destructive' : dailyPct >= 80 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${dailyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => resetLimits(s.id)}
                    className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Reset Limits
                  </button>
                  <button
                    onClick={() => testVerify(s.id)}
                    disabled={!testPhone.trim()}
                    className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-40 transition-colors"
                  >
                    Test Verify
                  </button>
                </div>

                {/* Test result */}
                {testResults[s.id] && (
                  <p className={`text-xs font-mono px-2 py-1.5 rounded border ${
                    testResults[s.id]?.startsWith('✓')
                      ? 'bg-success/10 text-success border-success/20'
                      : testResults[s.id] === 'checking…'
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {testResults[s.id]}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
