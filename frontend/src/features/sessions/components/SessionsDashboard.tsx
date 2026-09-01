/**
 * SessionsDashboard — WhatsApp session management with rate limiting
 * Beautiful UI with exact mockup structure and enhanced functionality
 */
import { useState, useEffect } from "react";
import {
  Server,
  RotateCcw,
  Clock,
  Phone,
  Plus,
  Zap,
  Send,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WABridgeConfig } from "@/features/layout/schemas/layout.schema";
import type { Session } from "../schemas/session.schema";
import { getSessionQuota, formatDuration } from "../utils/quota";
import { SessionNumberVerifierModal } from "./SessionNumberVerifierModal";
import { SessionTestMessageModal } from "./SessionTestMessageModal";

interface SessionsDashboardProps {
  sessions: Session[];
  config: WABridgeConfig;
  onResetSessionLimits: (id: string) => void;
  onUpdateSessions: (sessions: Session[]) => void;
  onAddSession: () => void;
  onSyncSession: (id: string) => void;
  onVerifyNumber: (
    sessionId: string,
    phone: string,
  ) => Promise<{
    isRegistered: boolean;
    waId?: string;
    error?: string;
  }>;
  onSendTest: (
    sessionId: string,
    phone: string,
    message: string,
  ) => Promise<void>;
}

export function SessionsDashboard({
  sessions,
  onResetSessionLimits,
  onAddSession,
  onSyncSession,
  onVerifyNumber,
  onSendTest,
}: SessionsDashboardProps) {
  const [now, setNow] = useState<number>(Date.now());
  const [verifierModalSession, setVerifierModalSession] =
    useState<Session | null>(null);
  const [testMessageModalSession, setTestMessageModalSession] =
    useState<Session | null>(null);

  // Update clock every second for smooth reset countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Overview Top Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <span>WhatsApp Sessions</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor and manage WhatsApp Business sessions with rate limiting
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Session Button */}
          <button
            type="button"
            onClick={onAddSession}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Session
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-md">
          <Server className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No sessions configured. Add sessions in Settings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const quota = getSessionQuota(session, now);

            return (
              <div
                key={session.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-md space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Session Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                        WA
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground truncate max-w-42.5">
                          {session.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {session.phoneNumber || session.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          session.status === "connected"
                            ? "bg-success/10 text-success border border-success/30"
                            : "bg-warning/10 text-warning border border-warning/30"
                        }`}
                      >
                        {session.status}
                      </span>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title="Session options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => onResetSessionLimits(session.id)}
                            className="cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Reset Limits
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Quota Counters */}
                  <div className="space-y-4 pt-3">
                    {/* Hourly Rate Limit */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>Hourly Limit</span>
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            quota.isHourlyCapped
                              ? "text-destructive"
                              : "text-success"
                          }`}
                        >
                          {quota.hourlyUsed} / {quota.hourlyLimit} msgs
                        </span>
                      </div>

                      {/* Visual Quota Display - Segments for small limits, progress bar for large */}
                      {quota.hourlyLimit <= 10 ? (
                        // Segment bars for limits ≤ 10 (easier to see individual slots)
                        <div className="grid grid-cols-5 gap-1.5">
                          {Array.from({ length: quota.hourlyLimit }).map(
                            (_, idx) => {
                              const isUsed = idx < quota.hourlyUsed;
                              return (
                                <div
                                  key={idx}
                                  className={`h-2 rounded-sm transition-all ${
                                    isUsed
                                      ? quota.isHourlyCapped
                                        ? "bg-destructive"
                                        : "bg-success"
                                      : "bg-muted border border-border"
                                  }`}
                                  title={
                                    isUsed
                                      ? `Used slot #${idx + 1}`
                                      : `Available slot #${idx + 1}`
                                  }
                                />
                              );
                            },
                          )}
                        </div>
                      ) : (
                        // Progress bar for limits > 10 (more compact)
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full transition-all ${
                              quota.isHourlyCapped
                                ? "bg-destructive"
                                : "bg-success"
                            }`}
                            style={{
                              width: `${(quota.hourlyUsed / quota.hourlyLimit) * 100}%`,
                            }}
                          />
                        </div>
                      )}

                      {quota.isHourlyCapped && quota.nextHourlySlotMs && (
                        <p className="text-[11px] text-warning flex items-center gap-1 font-medium pt-0.5">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>
                            Next slot opens in:{" "}
                            {formatDuration(quota.nextHourlySlotMs)}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Daily Rate Limit */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                          <span>Daily Limit</span>
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {quota.dailyUsed} / {quota.dailyLimit} msgs
                        </span>
                      </div>

                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full transition-all ${
                            quota.isDailyCapped
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                          style={{
                            width: `${(quota.dailyUsed / quota.dailyLimit) * 100}%`,
                          }}
                        />
                      </div>

                      {quota.isDailyCapped && quota.nextDailySlotMs && (
                        <p className="text-[11px] text-destructive font-medium">
                          Daily cap reached! Resets in:{" "}
                          {formatDuration(quota.nextDailySlotMs)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Session */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Check Number Button */}
                    <button
                      type="button"
                      onClick={() => setVerifierModalSession(session)}
                      className="w-full px-2.5 py-1 rounded-lg text-[11px] bg-success/10 hover:bg-success/20 text-success border border-success/20 transition-colors flex items-center justify-center gap-1 font-semibold"
                      title="Verify a phone number using this session"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Check Number</span>
                    </button>

                    {/* Send Test Button */}
                    <button
                      type="button"
                      onClick={() => setTestMessageModalSession(session)}
                      className="w-full px-2.5 py-1 rounded-lg text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center justify-center gap-1 font-semibold"
                      title="Send a test WhatsApp message using this session"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Test</span>
                    </button>
                  </div>

                  {/* Sync Session Status Button (conditionally rendered, full width) */}
                  {session.status !== "connected" && (
                    <button
                      type="button"
                      onClick={() => onSyncSession(session.id)}
                      className="w-full px-2.5 py-1 rounded-lg text-[11px] bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 transition-colors flex items-center justify-center gap-1 font-semibold"
                      title="Sync session status with WABridge"
                    >
                      <Server className="w-3 h-3" />
                      <span>Sync Status</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Number Verifier Modal */}
      {verifierModalSession && (
        <SessionNumberVerifierModal
          isOpen={!!verifierModalSession}
          onClose={() => setVerifierModalSession(null)}
          session={verifierModalSession}
          onVerify={onVerifyNumber}
        />
      )}

      {/* Session Test Message Modal */}
      {testMessageModalSession && (
        <SessionTestMessageModal
          isOpen={!!testMessageModalSession}
          onClose={() => setTestMessageModalSession(null)}
          session={testMessageModalSession}
          onSendTest={onSendTest}
        />
      )}
    </div>
  );
}
