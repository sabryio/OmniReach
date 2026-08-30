/**
 * QueueAndLogsView — container with 4 sub-tabs:
 *   Queue · Event Stream · Analytics · Logs
 *
 * REFACTORED: All state logic extracted to useQueueAndLogs hook.
 * Component is now purely presentational, receiving data and callbacks.
 */
import { Activity, Radio, BarChart2, Terminal } from "lucide-react";
import type { QueueItem, LogEntry, SchedulerState } from "@/types";
import { useQueueAndLogs } from "../hooks/useQueue";
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

export function QueueAndLogsView({
  queue,
  logs,
  schedulerState,
  onClearLogs,
}: QueueAndLogsViewProps) {
  const {
    activeTab,
    setActiveTab,
    queueCounts,
    queueFilter,
    setQueueFilter,
    queueSearch,
    setQueueSearch,
    filteredQueue,
    selectedPayload,
    setSelectedPayload,
    getQueueCountFor,
    categoryFilter,
    setCategoryFilter,
    logSearch,
    setLogSearch,
    filteredLogs,
    eventStreamLogs,
    selectedLogDetail,
    setSelectedLogDetail,
  } = useQueueAndLogs(queue, logs);

  // ── Tab definitions ────────────────────────────────────────────────────────
  const TABS = [
    {
      id: "queue" as const,
      label: `Live Queue (${queue.length})`,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: "events" as const,
      label: `Event Stream (${eventStreamLogs.length})`,
      icon: (
        <Radio
          className={`w-3.5 h-3.5 ${activeTab === "events" ? "text-destructive animate-pulse" : "text-destructive/60"}`}
        />
      ),
    },
    {
      id: "analytics" as const,
      label: "Telemetry",
      icon: <BarChart2 className="w-3.5 h-3.5" />,
    },
    {
      id: "logs" as const,
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
          {
            label: "Pending",
            value: queueCounts.pendingCount,
            cls: "text-foreground",
          },
          { label: "Held", value: queueCounts.heldCount, cls: "text-warning" },
          { label: "Sent", value: queueCounts.sentCount, cls: "text-success" },
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
      {activeTab === "queue" && (
        <QueueTab
          queue={queue}
          queueFilter={queueFilter}
          setQueueFilter={setQueueFilter}
          searchQuery={queueSearch}
          setSearchQuery={setQueueSearch}
          filteredQueue={filteredQueue}
          selectedPayload={selectedPayload}
          setSelectedPayload={setSelectedPayload}
          getQueueCountFor={getQueueCountFor}
        />
      )}
      {activeTab === "events" && (
        <EventStreamTab
          logs={eventStreamLogs}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          searchQuery={logSearch}
          setSearchQuery={setLogSearch}
          filteredLogs={filteredLogs.filter((l) => l.category !== "system")}
          selectedLogDetail={selectedLogDetail}
          setSelectedLogDetail={setSelectedLogDetail}
        />
      )}
      {activeTab === "analytics" && <AnalyticsTab queue={queue} logs={logs} />}
      {activeTab === "logs" && (
        <LogsTab
          logs={logs}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          searchQuery={logSearch}
          setSearchQuery={setLogSearch}
          filteredLogs={filteredLogs}
          selectedLogDetail={selectedLogDetail}
          setSelectedLogDetail={setSelectedLogDetail}
          onClearLogs={onClearLogs}
        />
      )}
    </div>
  );
}
