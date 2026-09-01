/**
 * SessionNumberVerifierModal — Quick phone verification scoped to a specific session
 * Opens from session card "Check Number" button
 */
import { useState } from "react";
import {
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Session } from "../schemas/session.schema";

interface SessionNumberVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onVerify: (sessionId: string, phone: string) => Promise<{
    isRegistered: boolean;
    waId?: string;
    error?: string;
  }>;
}

export function SessionNumberVerifierModal({
  isOpen,
  onClose,
  session,
  onVerify,
}: SessionNumberVerifierModalProps) {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    isRegistered: boolean;
    phone: string;
    waId?: string;
    error?: string;
    timestamp: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) return;

    setIsChecking(true);
    setResult(null);

    try {
      const response = await onVerify(session.id, phone.trim());
      setResult({
        ...response,
        phone: phone.trim(),
        timestamp: Date.now(),
      });
    } catch (error) {
      setResult({
        isRegistered: false,
        phone: phone.trim(),
        error: error instanceof Error ? error.message : "Verification failed",
        timestamp: Date.now(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setResult(null);
    onClose();
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
                Verify Phone Number
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Using session: {session.name} ({session.phoneNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1 font-semibold">
              Phone Number to Verify
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +201234567890"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Enter the phone number you want to check if it's registered on
              WhatsApp
            </p>
          </div>

          <button
            type="submit"
            disabled={isChecking || !phone.trim()}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck
              className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
            />
            <span>
              {isChecking ? "Checking..." : "Verify WhatsApp Status"}
            </span>
          </button>
        </form>

        {/* Result Area */}
        {result && (
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              result.isRegistered
                ? "bg-success/10 border-success/30"
                : "bg-warning/10 border-warning/30"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.isRegistered ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-foreground">
                    Active WhatsApp Number!
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span className="text-foreground">Not Registered</span>
                </>
              )}
            </div>

            <div className="text-[11px] space-y-1.5 font-mono text-muted-foreground pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span>Phone:</span>
                <span className="text-foreground font-semibold">
                  {result.phone}
                </span>
              </div>
              {result.waId && (
                <div className="flex items-center justify-between">
                  <span>WhatsApp ID:</span>
                  <span className="text-primary font-semibold">
                    {result.waId}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    result.isRegistered ? "text-success" : "text-warning"
                  }`}
                >
                  {result.isRegistered ? "Registered" : "Unregistered"}
                </span>
              </div>
              {result.error && (
                <div className="pt-1.5 border-t border-border/50">
                  <p className="text-warning text-[10px]">
                    Error: {result.error}
                  </p>
                </div>
              )}
              <div className="pt-1.5 border-t border-border/50 text-[10px]">
                Checked at: {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
