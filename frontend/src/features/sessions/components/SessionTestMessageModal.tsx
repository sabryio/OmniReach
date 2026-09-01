/**
 * SessionTestMessageModal — Send test WhatsApp messages from a specific session
 * Opens from session card "Send Test" button
 */
import { useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  X,
} from "lucide-react";
import type { Session } from "../schemas/session.schema";

interface SessionTestMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSendTest: (sessionId: string, phone: string, message: string) => Promise<void>;
}

export function SessionTestMessageModal({
  isOpen,
  onClose,
  session,
  onSendTest,
}: SessionTestMessageModalProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    phone: string;
    message: string;
    error?: string;
    timestamp: number;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim() || !message.trim()) return;

    setIsSending(true);
    setResult(null);

    try {
      await onSendTest(session.id, phone.trim(), message.trim());
      setResult({
        success: true,
        phone: phone.trim(),
        message: message.trim(),
        timestamp: Date.now(),
      });
    } catch (error) {
      setResult({
        success: false,
        phone: phone.trim(),
        message: message.trim(),
        error: error instanceof Error ? error.message : "Failed to send message",
        timestamp: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setMessage("");
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
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Send Test Message
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
              Recipient Phone Number
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
              Enter the phone number to receive the test message
            </p>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1 font-semibold">
              Message Text
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your test message here..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              This message will count against your hourly and daily limits
            </p>
          </div>

          <button
            type="submit"
            disabled={isSending || !phone.trim() || !message.trim()}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send
              className={`w-4 h-4 ${isSending ? "animate-spin" : ""}`}
            />
            <span>
              {isSending ? "Sending..." : "Send Test Message"}
            </span>
          </button>
        </form>

        {/* Result Area */}
        {result && (
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              result.success
                ? "bg-success/10 border-success/30"
                : "bg-destructive/10 border-destructive/30"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-foreground">
                    Message Sent Successfully!
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-foreground">Send Failed</span>
                </>
              )}
            </div>

            <div className="text-[11px] space-y-1.5 font-mono text-muted-foreground pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span>To:</span>
                <span className="text-foreground font-semibold">
                  {result.phone}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="shrink-0">Message:</span>
                <span className="text-foreground font-semibold text-right break-words">
                  {result.message.length > 60
                    ? `${result.message.slice(0, 60)}...`
                    : result.message}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span
                  className={`font-semibold ${
                    result.success ? "text-success" : "text-destructive"
                  }`}
                >
                  {result.success ? "Delivered" : "Failed"}
                </span>
              </div>
              {result.error && (
                <div className="pt-1.5 border-t border-border/50">
                  <p className="text-destructive text-[10px]">
                    Error: {result.error}
                  </p>
                </div>
              )}
              <div className="pt-1.5 border-t border-border/50 text-[10px]">
                Sent at: {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
