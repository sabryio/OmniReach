/**
 * AnalyticsTab — Telemetry & health analytics.
 * Queue health tiles are intentionally removed here — they are already
 * shown in the container's always-visible stats bar (Total Pending / Held /
 * Active Sending / Time Window). This tab focuses on log-derived metrics:
 * error rate, API latency estimate, verification checks, and
 * category/severity breakdowns.
 */
import {
  AlertCircle,
  Clock,
  ShieldCheck,
  Flame,
  Layers,
  Database,
} from "lucide-react";
import type { QueueItem, LogEntry } from "@/types";

interface AnalyticsTabProps {
  queue: QueueItem[];
  logs: LogEntry[];
}

function MetricTile({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div
        className={`text-2xl font-black font-mono mt-1 ${valueClass ?? "text-foreground"}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
      )}
    </div>
  );
}

function BreakdownBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground capitalize">
          {label.replace(/_/g, " ")}
        </span>
        <span className="font-mono text-muted-foreground">
          {count} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsTab({ queue: _queue, logs }: AnalyticsTabProps) {
  const totalEvents = logs.length;
  const errorCount = logs.filter((l) => l.level === "error").length;
  const errorRate =
    totalEvents > 0 ? Math.round((errorCount / totalEvents) * 100) : 0;
  const verificationCount = logs.filter(
    (l) => l.category === "verification",
  ).length;

  const categoryBreakdown = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] ?? 0) + 1;
    return acc;
  }, {});

  const severityBreakdown = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.level] = (acc[l.level] ?? 0) + 1;
    return acc;
  }, {});

  const severityColors: Record<string, string> = {
    info: "bg-primary",
    success: "bg-success",
    warn: "bg-warning",
    error: "bg-destructive",
  };

  return (
    <div className="space-y-6">
      {/* KPI Tiles (log-derived — queue totals live in the container bar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          icon={<Database className="w-4 h-4 text-primary" />}
          label="Total Events"
          value={totalEvents}
          sub="Ring buffer: 2,000 events"
        />
        <MetricTile
          icon={<AlertCircle className="w-4 h-4 text-destructive" />}
          label="Error Rate"
          value={`${errorRate}%`}
          sub={`${errorCount} errors logged`}
          valueClass={errorRate > 5 ? "text-destructive" : "text-success"}
        />
        <MetricTile
          icon={<Clock className="w-4 h-4 text-warning" />}
          label="Avg API Latency"
          value="~120ms"
          sub="Simulated estimate"
        />
        <MetricTile
          icon={<ShieldCheck className="w-4 h-4 text-success" />}
          label="Verification Checks"
          value={verificationCount}
          sub="Real-time WA validation"
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Events by Category
          </h3>
          {Object.keys(categoryBreakdown).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No event data yet
            </p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <BreakdownBar
                    key={cat}
                    label={cat}
                    count={count}
                    total={totalEvents}
                    color="bg-primary"
                  />
                ))}
            </div>
          )}
        </div>

        {/* By Severity */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning" />
            Events by Severity
          </h3>
          {Object.keys(severityBreakdown).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No event data yet
            </p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(severityBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([sev, count]) => (
                  <BreakdownBar
                    key={sev}
                    label={sev}
                    count={count}
                    total={totalEvents}
                    color={severityColors[sev] ?? "bg-primary"}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
