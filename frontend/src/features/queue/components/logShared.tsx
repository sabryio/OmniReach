/**
 * Shared constants and components for the Queue & Logs feature.
 * Eliminates duplicate category lists, filter UIs, and detail modals
 * that were previously copy-pasted across EventStreamTab and LogsTab.
 */
import { X } from "lucide-react";
import type { LogEntry } from "@/types";

// ─── Shared category list ─────────────────────────────────────────────────────

export const LOG_CATEGORIES = [
  { id: "all",          label: "All"          },
  { id: "verification", label: "Verification" },
  { id: "send",         label: "Send"         },
  { id: "rate_limit",   label: "Rate Limit"   },
  { id: "scheduler",    label: "Scheduler"    },
  { id: "session",      label: "Session"      },
  { id: "system",       label: "System"       },
] as const;

// ─── Shared severity badge ────────────────────────────────────────────────────

export function severityBadgeClass(level: string) {
  if (level === "success") return "bg-success/15 text-success border-success/30";
  if (level === "warn")    return "bg-warning/15 text-warning border-warning/30";
  if (level === "error")   return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-muted text-muted-foreground border-border";
}

export function levelColor(level: string) {
  if (level === "success") return "text-success";
  if (level === "warn")    return "text-warning";
  if (level === "error")   return "text-destructive";
  return "text-muted-foreground";
}

export function levelDot(level: string) {
  if (level === "success") return "bg-success";
  if (level === "warn")    return "bg-warning";
  if (level === "error")   return "bg-destructive";
  return "bg-muted-foreground";
}

// ─── Shared category filter pill bar ─────────────────────────────────────────

interface CategoryFilterBarProps {
  active: string;
  onChange: (id: string) => void;
}

export function CategoryFilterBar({ active, onChange }: CategoryFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {LOG_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
            active === cat.id
              ? "bg-primary text-primary-foreground shadow-sm font-semibold"
              : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── Shared log detail modal ──────────────────────────────────────────────────

interface LogDetailModalProps {
  log: LogEntry;
  onClose: () => void;
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold border px-2 py-0.5 rounded ${severityBadgeClass(log.level)}`}
            >
              {log.level}
            </span>
            <h3 className="text-sm font-bold text-foreground truncate max-w-sm">
              {log.message}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">Timestamp</span>
            <span className="font-mono text-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Category</span>
            <span className="px-2 py-0.5 rounded bg-muted text-primary border border-border font-mono text-[11px]">
              {log.category}
            </span>
          </div>
        </div>

        {/* Payload */}
        {log.details && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
              Details
            </span>
            <pre className="text-[11px] font-mono text-success bg-muted/30 rounded-xl p-4 overflow-auto max-h-64 border border-border">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
