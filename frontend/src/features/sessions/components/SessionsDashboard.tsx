/**
 * SessionsDashboard — WhatsApp session management with rate limiting
 * Beautiful UI with exact mockup structure and enhanced functionality
 */
import { useState, useEffect } from "react";
import {
  Server,
  Zap,
  RotateCcw,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { WABridgeConfig } from "@/features/layout/schemas/layout.schema";
import type { Session } from "../schemas/session.schema";
import { getSessionQuota, formatDuration } from "../utils/quota";

interface SessionsDashboardProps {
  sessions: Session[];
  config: WABridgeConfig;
  onResetSessionLimits: (id: string) => void;
  onUpdateSessions: (sessions: Session[]) => void;
  onAddSession: () => void;
  onSyncSession: (id: string) => void;
}

export function SessionsDashboard({
  sessions,
  onResetSessionLimits,
  onUpdateSessions,
  onAddSession,
  onSyncSession,
}: SessionsDashboardProps) {
  const [testPhone, setTestPhone] = useState<string>("+966 50 123 4567");
  const [testResult, setTestResult] = useState<{
    sessionId: string;
    message: string;
    success: boolean;
  } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every second for smooth reset countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTestVerifyNumber = async (sessionId: string) => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const isRegistered = Math.random() > 0.2; // 80% success rate

    setIsTesting(false);

    if (isRegistered) {
      setTestResult({
        sessionId,
        success: true,
        message: `✅ Number ${testPhone} is REGISTERED on WhatsApp!`,
      });
    } else {
      setTestResult({
        sessionId,
        success: false,
        message: `❌ Number ${testPhone} is NOT registered on WhatsApp`,
      });
    }
  };

  const handleSendTestMessage = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const quota = getSessionQuota(session, now);
    if (!quota.canSend) {
      setTestResult({
        sessionId,
        success: false,
        message: `🚫 Cannot send: ${quota.reason}`,
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() > 0.1; // 90% success rate

    setIsTesting(false);

    if (success) {
      // Record send
      const updatedSession = {
        ...session,
        hourlySentTimestamps: [...session.hourlySentTimestamps, Date.now()],
        dailySentTimestamps: [...session.dailySentTimestamps, Date.now()],
      };
      const updatedList = sessions.map((s) =>
        s.id === sessionId ? updatedSession : s,
      );
      onUpdateSessions(updatedList);

      setTestResult({
        sessionId,
        success: true,
        message: `🚀 Test message sent successfully! Msg ID: ${Date.now()}`,
      });
    } else {
      setTestResult({
        sessionId,
        success: false,
        message: "❌ Send failed: Network error",
      });
    }
  };

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
          {/* Quick Test Box */}
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Enter test phone..."
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground font-mono w-44 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all"
            />
            <span className="text-[10px] text-muted-foreground">
              Check Number
            </span>
          </div>

          {/* Add Session Button */}
          <button
            type="button"
            onClick={onAddSession}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Add Session
          </button>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-sm ${
            testResult.success
              ? "bg-success/10 border-success/30 text-success"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>{testResult.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="text-[10px] font-bold uppercase hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

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

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        session.status === "connected"
                          ? "bg-success/10 text-success border border-success/30"
                          : "bg-warning/10 text-warning border border-warning/30"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  {/* QR Code Display for unpaired sessions */}
                  {session.status === "qr_required" && session.qrCodeData && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold">
                          Scan to pair WhatsApp
                        </p>
                        <img
                          src={session.qrCodeData}
                          alt="QR Code"
                          className="w-40 h-40 mx-auto rounded-lg border-2 border-primary/20 bg-white p-2"
                        />
                        <button
                          type="button"
                          onClick={() => onSyncSession(session.id)}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Refresh QR Code
                        </button>
                      </div>
                    </div>
                  )}

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
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestVerifyNumber(session.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold border border-border transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <span>Check Number</span>
                    </button>

                    <button
                      type="button"
                      disabled={isTesting || !quota.canSend}
                      onClick={() => handleSendTestMessage(session.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                        quota.canSend
                          ? "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Test</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    id={`reset-limits-${session.id}`}
                    onClick={() => onResetSessionLimits(session.id)}
                    className="w-full px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-colors flex items-center justify-center gap-1"
                    title="Reset rate counters to test edge cases"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Limits</span>
                  </button>

                  {/* Sync Session Status Button */}
                  {session.status !== "connected" && (
                    <button
                      type="button"
                      onClick={() => onSyncSession(session.id)}
                      className="w-full px-2.5 py-1 rounded-lg text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors flex items-center justify-center gap-1 font-semibold"
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
    </div>
  );
}
