/**
 * AddSessionModal — Create new WhatsApp session
 */
import { useState } from "react";
import { X, Plus, Server } from "lucide-react";
import { useCreateSession } from "../hooks/useSessionMutations";

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSessionModal({ isOpen, onClose }: AddSessionModalProps) {
  const { createSession, isCreating, error, reset } = useCreateSession();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hourlyLimit, setHourlyLimit] = useState("1000");
  const [dailyLimit, setDailyLimit] = useState("10000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phoneNumber.trim() || !apiKey.trim()) {
      return;
    }

    try {
      await createSession({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        apiKey: apiKey.trim(),
        hourlyLimit: parseInt(hourlyLimit) || 1000,
        dailyLimit: parseInt(dailyLimit) || 10000,
      });

      // Reset form and close
      setName("");
      setPhoneNumber("");
      setApiKey("");
      setHourlyLimit("1000");
      setDailyLimit("10000");
      reset();
      onClose();
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to create session:", err);
    }
  };

  const handleClose = () => {
    setName("");
    setPhoneNumber("");
    setApiKey("");
    setHourlyLimit("1000");
    setDailyLimit("10000");
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Add WhatsApp Session
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Connect a new WhatsApp Business account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              <p className="font-semibold">Failed to create session</p>
              <p className="text-[11px] mt-0.5">{String(error)}</p>
            </div>
          )}

          {/* Session Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Session Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Account, Support Line"
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <p className="text-[10px] text-muted-foreground">
              A friendly name to identify this WhatsApp connection
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+201234567890"
              required
              pattern="^\+?\d{10,15}$"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <p className="text-[10px] text-muted-foreground">
              WhatsApp number for this session (10-15 digits with optional +)
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              WABridge API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key from WABridge"
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <p className="text-[10px] text-muted-foreground">
              Obtained from your WABridge server configuration
            </p>
          </div>

          {/* Rate Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Hourly Limit
              </label>
              <input
                type="number"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                min="1"
                max="10000"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-[10px] text-muted-foreground">
                Messages per hour
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Daily Limit
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                min="1"
                max="100000"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-[10px] text-muted-foreground">
                Messages per 24h
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isCreating ||
                !name.trim() ||
                !phoneNumber.trim() ||
                !apiKey.trim()
              }
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              {isCreating ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
