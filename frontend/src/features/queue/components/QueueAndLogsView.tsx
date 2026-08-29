/**
 * QueueAndLogsView — container with 4 sub-tabs:
 *   Queue · Event Stream · Analytics · Logs
 *
 * Changes from original:
 * - Removed duplicate scheduler stats bar that overlapped with
 *   Analytics tab's Queue Health tiles. One set of stats lives here,
 *   derived directly from the queue prop so Held is a single source
 *   of truth (not split between schedulerState and queue filter).
 * - Event Stream tab count now shows log entries for that tab, not the
 *   same number as Exec Logs.
 * - onClearLogs is passed only to LogsTab (the correct owner).
 */
import { useState } from "react";
import { Activity, Radio, BarChart2, Terminal } from "lucide-react";
import type { QueueItem, LogEntry, SchedulerState } from "@/types";
import { QueueTab } from "./QueueTab";
import { EventStreamTab } from "./EventStreamTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { LogsTab } from "./LogsTab";

interface QueueAndLogsViewProps {
  queue: QueueItem[];
  logs: LogEntry[];
  schedulerState: SchedulerState;
  onClearLogs: () => void;
}

type SubTab = "queue" | "events" | "analytics" | "logs";

export function QueueAndLogsView({
  queue,
  logs,
  schedulerState,
  onClearLogs,
}: QueueAndLogsViewProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("queue");

  // ── Single-source queue counts ─────────────────────────────────────────────
  const pendingCount = queue.filter(
    (q) =>
      q.status === "pending" ||
      q.status === "sending" ||
      q.status === "verifying",
  ).length;
  const heldCount = queue.filter(
    (q) => q.status === "held_rate_limit" || q.status === "held_time_window",
  ).length;
  const sentCount = queue.filter((q) => q.status === "sent").length;

  // ── Tab definitions ────────────────────────────────────────────────────────
  const TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "queue",
      label: `Live Queue (${queue.length})`,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: "events",
      label: `Event Stream (${logs.filter((l) => l.category !== "system").length})`,
      icon: (
        <Radio
          className={`w-3.5 h-3.5 ${activeTab === "events" ? "text-destructive animate-pulse" : "text-destructive/60"}`}
        />
      ),
    },
    {
      id: "analytics",
      label: "Telemetry",
      icon: <BarChart2 className="w-3.5 h-3.5" />,
    },
    {
      id: "logs",
      label: `Exec Logs (${logs.length})`,
      icon: <Terminal className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Sub-tab Toggle */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Queue &amp; Logs
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comprehensive tracking of dispatches, verifications, rate limits,
            and audit streams
          </p>
        </div>

        {/* Scheduler pill + sub-tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${
              schedulerState.isRunning
                ? "bg-success/10 text-success border-success/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${schedulerState.isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
            />
            {schedulerState.isRunning
              ? "Scheduler Running"
              : "Scheduler Paused"}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border text-xs font-medium">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Single queue stats bar — the only place these numbers appear */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: pendingCount, cls: "text-foreground" },
          { label: "Held", value: heldCount, cls: "text-warning" },
          { label: "Sent", value: sentCount, cls: "text-success" },
          {
            label: "Time Window",
            value: schedulerState.isWithinTimeWindow ? "Open" : "Closed",
            cls: schedulerState.isWithinTimeWindow
              ? "text-success"
              : "text-muted-foreground",
          },
        ].map(({ label, value, cls }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-3 text-center shadow-sm"
          >
            <p className={`text-lg font-black font-mono ${cls}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeTab === "queue" && <QueueTab queue={queue} />}
      {activeTab === "events" && <EventStreamTab logs={logs} />}
      {activeTab === "analytics" && <AnalyticsTab queue={queue} logs={logs} />}
      {activeTab === "logs" && (
        <LogsTab logs={logs} onClearLogs={onClearLogs} />
      )}
    </div>
  );
}
