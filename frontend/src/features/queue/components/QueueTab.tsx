/**
 * QueueTab — Live send queue with status filtering, search, and payload inspector
 * REFACTORED: Now purely presentational, receives all state as props
 * OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
import { memo } from "react";
import {
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ShieldCheck,
  Code,
  X,
  XCircle,
} from "lucide-react";
import type { QueueItem } from "@/features/queue/schemas/queue.schema";

interface QueueTabProps {
  queue: QueueItem[];
  queueFilter: string;
  setQueueFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredQueue: QueueItem[];
  selectedPayload: { title: string; json: string } | null;
  setSelectedPayload: (payload: { title: string; json: string } | null) => void;
  getQueueCountFor: (filterId: string) => number;
  onCancelItem: (id: string) => void;
}

const QUEUE_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "sending", label: "Sending" },
  { id: "held_rate_limit", label: "Rate Hold" },
  { id: "held_time_window", label: "Window Hold" },
  { id: "sent", label: "Sent" },
  { id: "skipped_unregistered", label: "Skipped" },
  { id: "failed", label: "Failed" },
] as const;

function StatusBadge({
  status,
  error,
}: {
  status: QueueItem["status"];
  error?: string;
}) {
  switch (status) {
    case "sent":
      return (
        <span className="inline-flex items-center gap-1 text-success font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Sent
        </span>
      );
    case "sending":
      return (
        <span className="inline-flex items-center gap-1 text-primary font-semibold animate-pulse">
          <Zap className="w-3.5 h-3.5" /> Sending...
        </span>
      );
    case "verifying":
      return (
        <span className="inline-flex items-center gap-1 text-warning font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> Verifying WA...
        </span>
      );
    case "skipped_unregistered":
      return (
        <span
          className="inline-flex items-center gap-1 text-warning font-semibold"
          title={error}
        >
          🔴 Skipped (Unregistered)
        </span>
      );
    case "held_rate_limit":
      return (
        <span
          className="inline-flex items-center gap-1 text-warning font-semibold"
          title={error}
        >
          <Clock className="w-3.5 h-3.5" /> Rate Hold
        </span>
      );
    case "held_time_window":
      return (
        <span className="inline-flex items-center gap-1 text-primary font-semibold">
          <Clock className="w-3.5 h-3.5" /> Window Hold
        </span>
      );
    case "failed":
      return (
        <span
          className="inline-flex items-center gap-1 text-destructive font-semibold"
          title={error}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Failed
        </span>
      );
    default:
      return <span className="text-muted-foreground font-medium">Pending</span>;
  }
}

export const QueueTab = memo(function QueueTab({
  queueFilter,
  setQueueFilter,
  searchQuery,
  setSearchQuery,
  filteredQueue,
  selectedPayload,
  setSelectedPayload,
  getQueueCountFor,
  onCancelItem,
}: QueueTabProps) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden space-y-4 p-4 sm:p-5">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {QUEUE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setQueueFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                queueFilter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {f.label} ({getQueueCountFor(f.id)})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search phone or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Queue Table */}
      {filteredQueue.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          No queue items match the current filter
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-muted/20">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-semibold sticky top-0 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider w-8">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider">
                  Session
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider">
                  Message
                </th>
                <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQueue.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2.5 text-muted-foreground font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground truncate max-w-35">
                    {item.campaignTitle}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground">
                    {item.recipientName || "Customer"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">
                    {item.phone}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      status={item.status}
                      error={item.lastError ?? undefined}
                    />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                    {item.assignedSessionId || "Auto-balance"}
                  </td>
                  <td
                    className="px-3 py-2.5 text-muted-foreground truncate max-w-45"
                    title={item.renderedText}
                  >
                    {item.renderedText}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {item.responsePayload && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPayload({
                              title: `Payload — ${item.phone}`,
                              json: item.responsePayload || "{}",
                            })
                          }
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Inspect WABridge JSON Payload"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(item.status === "pending" ||
                        item.status === "held_rate_limit" ||
                        item.status === "held_time_window" ||
                        item.status === "failed") && (
                        <button
                          type="button"
                          onClick={() => onCancelItem(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Cancel this queue item"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payload Inspector Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                {selectedPayload.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-[11px] font-mono text-success bg-muted/30 rounded-xl p-4 overflow-auto max-h-96 border border-border">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(selectedPayload.json),
                    null,
                    2,
                  );
                } catch {
                  return selectedPayload.json;
                }
              })()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});
