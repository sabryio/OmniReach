/**
 * ReportsView — aggregate analytics + per-campaign export
 * Placeholder
 */
import type {
  Campaign,
  QueueItem,
  WABridgeSession,
  LogEntry,
  SchedulerState,
} from "@/types";
import { useReports } from "../hooks/useReports";

interface ReportsViewProps {
  campaigns: Campaign[];
  queue: QueueItem[];
  sessions?: WABridgeSession[];
  logs?: LogEntry[];
  schedulerState?: SchedulerState;
}

export function ReportsView({
  campaigns,
  queue,
}: ReportsViewProps) {
  const { totals, exportFullCsv, exportCampaignCsv } = useReports(
    campaigns,
    queue,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-foreground">Reports</h1>

      {/* Top summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Audience", value: totals.audience },
          {
            label: "Delivered",
            value: `${totals.delivered} (${totals.deliveryRate}%)`,
          },
          {
            label: "Unregistered",
            value: `${totals.unregistered} (${totals.unregisteredRate}%)`,
          },
          { label: "Sent Today", value: totals.sentToday },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg p-4"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-xl font-bold font-mono text-foreground mt-1">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Per-campaign cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Campaign Breakdown
          </h2>
          <button
            onClick={exportFullCsv}
            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            ↓ Export Full Audit CSV
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            No campaigns yet
          </div>
        ) : (
          campaigns.map((c) => {
            const pct =
              c.totalContacts > 0
                ? Math.round((c.sentCount / c.totalContacts) * 100)
                : 0;
            return (
              <div
                key={c.id}
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {c.id}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${
                      c.status === "completed"
                        ? "bg-success/20 text-success"
                        : c.status === "running"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {pct}% delivery rate
                  </p>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Total", value: c.totalContacts },
                    { label: "Sent", value: c.sentCount },
                    { label: "Unreg.", value: c.unregisteredCount },
                    { label: "Failed", value: c.failedCount },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded p-2">
                      <p className="font-bold font-mono text-sm text-foreground">
                        {value}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => exportCampaignCsv(c)}
                  className="text-xs px-3 py-1.5 rounded bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  ↓ Export Campaign CSV
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
