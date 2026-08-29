/**
 * QuickVerifierModal — F2 phone verification popup
 * Matches mockup: Lucide icons, proper text, styled results
 */
import {
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import type { WABridgeSession, WABridgeConfig } from "@/types";
import { useQuickVerifier } from "../hooks/useModals";

interface QuickVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: WABridgeSession[];
  config: WABridgeConfig;
}

export function QuickVerifierModal({
  isOpen,
  onClose,
  sessions,
  config,
}: QuickVerifierModalProps) {
  const {
    phone,
    setPhone,
    selectedSession,
    setSelectedSession,
    result,
    isChecking,
    check,
  } = useQuickVerifier(sessions, config);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    check();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Phone Number Verifier (Quick)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Direct query against WABridge daemon on localhost:8080.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1">
              Connected Sessions
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {sessions.length === 0 ? (
                <option value="">No sessions</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">
              Phone Number
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +966501234567 or +14155550122"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              In simulation mode: numbers ending in '4' simulate non-WhatsApp
              numbers.
            </p>
          </div>

          <button
            type="submit"
            disabled={isChecking || !phone.trim() || !selectedSession}
            className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            <ShieldCheck
              className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
            />
            <span>
              {isChecking ? "Checking..." : "Validate WhatsApp Status"}
            </span>
          </button>
        </form>

        {/* Result Area */}
        {result && (
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              result.isRegistered
                ? "bg-success/10 border-success/30 text-success"
                : "bg-warning/10 border-warning/30 text-warning"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              {result.isRegistered ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-foreground">
                    Active WhatsApp Number Found!
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-foreground">
                    Not Registered on WhatsApp
                  </span>
                </>
              )}
            </div>

            <div className="text-[11px] space-y-1 font-mono text-muted-foreground pt-1 border-t border-border">
              <p>
                Phone:{" "}
                <span className="text-foreground">{result.phone || phone}</span>
              </p>
              {result.waId && (
                <p>
                  WhatsApp JID:{" "}
                  <span className="text-primary">{result.waId}</span>
                </p>
              )}
              {result.error && (
                <p className="text-warning">Notice: {result.error}</p>
              )}
              <p className="text-[10px]">
                Checked at: {new Date(result.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
