/**
 * QuickVerifierModal — F2 phone verification popup
 * Placeholder
 */
import type { WABridgeSession, WABridgeConfig } from '@/types'
import { useQuickVerifier } from '../hooks/useModals'

interface QuickVerifierModalProps {
  isOpen: boolean
  onClose: () => void
  sessions: WABridgeSession[]
  config: WABridgeConfig
}

export function QuickVerifierModal({ isOpen, onClose, sessions, config }: QuickVerifierModalProps) {
  const { phone, setPhone, selectedSession, setSelectedSession, result, isChecking, check } =
    useQuickVerifier(sessions, config)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">☏</span>
            <h2 className="text-sm font-bold text-foreground">Phone Verifier</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>

        {/* Session selector */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sessions.length === 0
              ? <option value="">No sessions</option>
              : sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
            }
          </select>
        </div>

        {/* Phone input + check button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            placeholder="+1 415 555 0100"
            className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={check}
            disabled={!phone.trim() || !selectedSession || isChecking}
            className="px-3 py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isChecking ? '…' : 'Check'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`px-3 py-2.5 rounded-lg border text-xs font-mono ${
            result.isRegistered
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            {result.isRegistered ? (
              <div className="space-y-0.5">
                <p>✓ Registered on WhatsApp</p>
                {result.waId && <p className="text-[10px] opacity-70">{result.waId}</p>}
                <p className="text-[10px] opacity-70">{new Date(result.timestamp).toLocaleTimeString()}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p>✗ Not registered</p>
                {result.error && <p className="text-[10px] opacity-70">{result.error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
