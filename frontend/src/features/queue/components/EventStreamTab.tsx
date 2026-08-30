/**
 * EventStreamTab — Real-time event stream with category/severity filtering,
 * search, live toggle, export, and detail inspector.
 * Category list, badge helpers, and detail modal live in logShared.tsx.
 * REFACTORED: Now purely presentational, receives all state as props
 */
import { useState } from "react";
import {
  Filter,
  Search,
  Pause,
  Play,
  Download,
  Copy,
  Check,
} from "lucide-react";
import type { LogEntry } from "@/types";
import {
  CategoryFilterBar,
  LogDetailModal,
  severityBadgeClass,
} from "./logShared";

interface EventStreamTabProps {
  logs: LogEntry[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredLogs: LogEntry[];
  selectedLogDetail: LogEntry | null;
  setSelectedLogDetail: (log: LogEntry | null) => void;
}

const SEVERITIES = ["all", "info", "success", "warn", "error"] as const;

export function EventStreamTab({
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  filteredLogs,
  selectedLogDetail,
  setSelectedLogDetail,
}: EventStreamTabProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Additional local filtering for severity
  const severityFiltered = filteredLogs.filter(
    (ev) => severityFilter === "all" || ev.level === severityFilter,
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(severityFiltered, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = severityFiltered.map((e) =>
      [
        new Date(e.timestamp).toISOString(),
        e.level,
        e.category,
        `"${e.message.replace(/"/g, '""')}"`,
      ].join(","),
    );
    const blob = new Blob(
      [["timestamp,level,category,message", ...rows].join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-md space-y-4 p-4 sm:p-5">
      {/* Category Filter + Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-medium text-xs flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <CategoryFilterBar
            active={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live / paused toggle */}
          <button
            type="button"
            onClick={() => setIsLive((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isLive
                ? "bg-success/15 text-success border-success/30"
                : "bg-warning/15 text-warning border-warning/30"
            }`}
          >
            {isLive ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            <span>{isLive ? "Live" : "Paused"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1 rounded-lg text-xs bg-muted/50 text-muted-foreground hover:text-foreground border border-border flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-success" />
            CSV
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-2.5 py-1 rounded-lg text-xs bg-muted/50 text-muted-foreground hover:text-foreground border border-border flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            JSON
          </button>
        </div>
      </div>

      {/* Severity + Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium mr-1">
            Severity:
          </span>
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                severityFilter === sev
                  ? "bg-card text-foreground border border-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, payload, errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Event List */}
      {severityFiltered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          No events match current filters
        </div>
      ) : (
        <div className="space-y-1.5 max-h-137.5 overflow-y-auto font-mono text-[11px] bg-muted/20 p-3 rounded-xl border border-border">
          {severityFiltered.map((ev) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedLogDetail(ev)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    [{timeStr}]
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border shrink-0 ${severityBadgeClass(ev.level)}`}
                  >
                    {ev.level}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-primary border border-border shrink-0">
                    {ev.category}
                  </span>
                  <span className="font-semibold text-foreground truncate font-sans text-xs">
                    {ev.message}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(JSON.stringify(ev, null, 2), ev.id);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Copy event JSON"
                  >
                    {copiedId === ev.id ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLogDetail(ev);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-border transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedLogDetail && (
        <LogDetailModal
          log={selectedLogDetail}
          onClose={() => setSelectedLogDetail(null)}
        />
      )}
    </div>
  );
}
