/**
 * AboutModal — F1 help / about screen
 * Placeholder
 */
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              O
            </div>
            <div>
              <h2 className="font-bold text-foreground">OmniReach</h2>
              <p className="text-xs text-muted-foreground">
                React + Vite + TanStack + Rust
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Broadcast Integrity Rules */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Broadcast Integrity Rules
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {[
              "5 messages per hour per session",
              "30 messages per day per session",
              "Sending window: 9AM – 9PM only",
              "Pre-send WhatsApp registration check",
              "Full audit log for every send attempt",
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="text-primary mt-px shrink-0">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Architecture */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Architecture
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            OmniReach connects to a local WABridge daemon running on
            127.0.0.1:7171. The Rust backend handles rate limiting, scheduling,
            and WhatsApp session management. The React frontend communicates via
            REST API.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
