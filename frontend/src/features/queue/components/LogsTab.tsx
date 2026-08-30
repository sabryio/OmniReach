/**
 * LogsTab — Raw system log viewer with category filter, level coloring,
 * clear action, and detail payload inspector.
 * Category list, badge helpers, and detail modal live in logShared.tsx.
 * REFACTORED: Now purely presentational, receives all state as props
 */
import { Filter, Trash2 } from "lucide-react";
import type { LogEntry } from "@/types";
import {
  CategoryFilterBar,
  LogDetailModal,
  levelColor,
  levelDot,
} from "./logShared";

interface LogsTabProps {
  logs: LogEntry[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredLogs: LogEntry[];
  selectedLogDetail: LogEntry | null;
  setSelectedLogDetail: (log: LogEntry | null) => void;
  onClearLogs: () => void;
}

export function LogsTab({
  categoryFilter,
  setCategoryFilter,
  filteredLogs,
  selectedLogDetail,
  setSelectedLogDetail,
  onClearLogs,
}: LogsTabProps) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-md space-y-4 p-4 sm:p-5">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-medium text-xs flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <CategoryFilterBar
            active={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear all log entries?")) onClearLogs();
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Log Entries */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          No log entries match the current filter
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto bg-muted/20 p-3 rounded-xl border border-border font-mono text-[11px]">
          {filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={log.id}
                onClick={() => log.details && setSelectedLogDetail(log)}
                className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg border border-transparent hover:border-border hover:bg-card transition-all cursor-pointer group"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${levelDot(log.level)}`}
                />
                <span className="text-muted-foreground shrink-0 text-[10px] pt-0.5">
                  [{timeStr}]
                </span>
                <span className="px-1.5 py-0.5 rounded bg-card text-[10px] uppercase text-muted-foreground border border-border shrink-0">
                  {log.category}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold shrink-0 ${levelColor(log.level)}`}
                >
                  [{log.level}]
                </span>
                <span
                  className={`flex-1 leading-relaxed ${levelColor(log.level)}`}
                >
                  {log.message}
                </span>
                {log.details && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLogDetail(log);
                    }}
                    className="text-[10px] text-primary hover:underline shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    JSON
                  </button>
                )}
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
