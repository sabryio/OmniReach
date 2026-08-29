/**
 * DashboardView — styled with shadcn CSS variables via Tailwind utilities.
 * bg-card, text-foreground, text-muted-foreground, border-border,
 * bg-muted, bg-primary, text-primary, etc.
 */
import {
  Layers,
  Clock,
  Server,
  Activity,
  PlusCircle,
  CheckCircle2,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import type {
  Campaign,
  QueueItem,
  WABridgeSession,
  SchedulerState,
  LogEntry,
  SessionRateQuota,
} from "@/types";
import { useDashboard } from "../hooks/useDashboard";

interface DashboardViewProps {
  campaigns: Campaign[];
  queue: QueueItem[];
  sessions: WABridgeSession[];
  schedulerState: SchedulerState;
  logs: LogEntry[];
  onNavigate: (tab: string) => void;
  onNewCampaignClick: () => void;
  onToggleScheduler: () => void;
}

// Mock campaign data for demonstration (matches pharmacy/healthcare broadcast scenarios)
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-001",
    title: "Monthly Prescription Refill Reminder",
    status: "running",
    totalContacts: 1247,
    sentCount: 892,
    unregisteredCount: 43,
    failedCount: 8,
    createdAt: Date.now() - 3600000 * 4,
    startedAt: Date.now() - 3600000 * 3,
    templateText: "Your prescription is ready for refill",
    templateImageUrl: undefined,
  },
  {
    id: "camp-002",
    title: "COVID-19 Booster Dose Available",
    status: "running",
    totalContacts: 2156,
    sentCount: 2089,
    unregisteredCount: 54,
    failedCount: 13,
    createdAt: Date.now() - 3600000 * 24,
    startedAt: Date.now() - 3600000 * 23,
    templateText: "Schedule your booster shot today",
    templateImageUrl: undefined,
  },
  {
    id: "camp-003",
    title: "Lab Results Ready for Collection",
    status: "completed",
    totalContacts: 487,
    sentCount: 467,
    unregisteredCount: 18,
    failedCount: 2,
    createdAt: Date.now() - 3600000 * 48,
    startedAt: Date.now() - 3600000 * 47,
    completedAt: Date.now() - 3600000 * 46,
    templateText: "Your lab results are ready",
    templateImageUrl: undefined,
  },
  {
    id: "camp-004",
    title: "Annual Health Checkup Campaign",
    status: "scheduled",
    totalContacts: 3542,
    sentCount: 0,
    unregisteredCount: 0,
    failedCount: 0,
    createdAt: Date.now() - 3600000 * 2,
    scheduledFor: Date.now() + 3600000 * 24,
    templateText: "Book your annual checkup appointment",
    templateImageUrl: undefined,
  },
  {
    id: "camp-005",
    title: "Diabetes Care Program Enrollment",
    status: "running",
    totalContacts: 856,
    sentCount: 342,
    unregisteredCount: 27,
    failedCount: 5,
    createdAt: Date.now() - 3600000 * 12,
    startedAt: Date.now() - 3600000 * 10,
    templateText: "Join our diabetes care program",
    templateImageUrl: undefined,
  },
];

export function DashboardView({
  campaigns,
  queue,
  sessions,
  schedulerState,
  logs,
  onNavigate,
  onNewCampaignClick,
  onToggleScheduler,
}: DashboardViewProps) {
  // Use mock data for demonstration if no real campaigns exist
  const displayCampaigns = campaigns.length > 0 ? campaigns : MOCK_CAMPAIGNS;

  const {
    totalAudience,
    totalDelivered,
    totalUnregistered,
    deliveryRate,
    pendingQueueCount,
    heldRateLimitCount,
    totalHourlyRemaining,
    totalHourlyLimit,
    sessionQuotas,
  } = useDashboard({
    campaigns: displayCampaigns,
    queue,
    sessions,
    schedulerState,
    logs,
  });

  return (
    <div className="space-y-4 max-w-full">
      {/* ── Top Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Broadcast &amp; Compliance Operations</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time monitoring of WhatsApp number verification, rate quotas,
              and channel health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleScheduler}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              schedulerState.isRunning
                ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
                : "bg-success/10 text-success border-success/30 hover:bg-success/20"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {schedulerState.isRunning
                ? "Pause Dispatcher"
                : "Start Dispatcher"}
            </span>
          </button>

          <button
            type="button"
            onClick={onNewCampaignClick}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1 — Total Audience */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">
              Total Registered Audience
            </span>
            <Users className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground font-mono">
            {totalAudience}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Across {displayCampaigns.length} campaigns
          </p>
        </div>

        {/* 2 — Delivered */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Messages Delivered</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          </div>
          <p className="text-lg font-bold text-success font-mono">
            {totalDelivered}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {deliveryRate}% delivery rate
          </p>
        </div>

        {/* 3 — Unregistered */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">
              Anti-Ban Shield (Filtered)
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-warning" />
          </div>
          <p className="text-lg font-bold text-warning font-mono">
            {totalUnregistered}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Skipped (No WhatsApp)
          </p>
        </div>

        {/* 4 — Pending Queue */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">
              Messages Pending in Queue
            </span>
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-primary font-mono">
            {pendingQueueCount}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {heldRateLimitCount} on rate hold
          </p>
        </div>

        {/* 5 — Hourly Quota */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">
              Hourly Capacity Left
            </span>
            <Zap className="w-3.5 h-3.5 text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground font-mono">
            {totalHourlyRemaining} / {totalHourlyLimit}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Available across {sessions.length} sessions
          </p>
        </div>

        {/* 6 — Sessions */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">
              Active WABridge Channels
            </span>
            <Server className="w-3.5 h-3.5 text-success" />
          </div>
          <p className="text-lg font-bold text-foreground font-mono">
            {sessions.length}
          </p>
          <p className="text-[10px] text-success">All sessions healthy</p>
        </div>
      </div>

      {/* ── 3-Col Split ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 cols ─ Active Campaigns + Live Queue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Campaigns Panel */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="text-xs font-bold text-foreground">
                  Active &amp; Scheduled Broadcasts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("campaigns")}
                className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors group"
              >
                <span>View All ({displayCampaigns.length})</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {displayCampaigns.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <Layers className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  No broadcast campaigns recorded yet
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/60 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold">
                          Title
                        </th>
                        <th className="px-4 py-2.5 text-left font-semibold">
                          Status
                        </th>
                        <th className="px-4 py-2.5 text-left font-semibold">
                          Progress
                        </th>
                        <th className="px-4 py-2.5 text-right font-semibold">
                          Sent / Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-foreground bg-card">
                      {displayCampaigns.slice(0, 5).map((c) => {
                        const processed =
                          c.sentCount + c.unregisteredCount + c.failedCount;
                        const pct =
                          c.totalContacts > 0
                            ? Math.round((processed / c.totalContacts) * 100)
                            : 0;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => onNavigate("campaigns")}
                            className="hover:bg-muted/30 cursor-pointer transition-all group"
                          >
                            <td className="px-4 py-3 font-medium max-w-50 truncate">
                              <span className="group-hover:text-primary transition-colors">
                                {c.title}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                                  c.status === "running"
                                    ? "bg-success/10 text-success border-success/30 group-hover:bg-success/15"
                                    : c.status === "completed"
                                      ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/15"
                                      : "bg-warning/10 text-warning border-warning/30 group-hover:bg-warning/15"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-35">
                              <div className="space-y-1">
                                <div className="w-full bg-muted/80 h-1.5 rounded-full overflow-hidden border border-border/50 shadow-inner">
                                  <div
                                    className="bg-linear-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {pct}% complete
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              <span className="text-success font-bold">
                                {c.sentCount.toLocaleString()}
                              </span>
                              <span className="text-muted-foreground mx-1">
                                /
                              </span>
                              <span className="text-muted-foreground">
                                {c.totalContacts.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Live Queue Preview */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground">
                  Live Send Queue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("queue")}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>Open Full Queue ({queue.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Send queue is currently empty.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
                {queue.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-muted border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-foreground font-medium truncate max-w-35">
                        {item.recipientName ?? "Customer"}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {item.phone}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === "sent"
                          ? "bg-success/15 text-success border-success/20"
                          : item.status === "held_rate_limit"
                            ? "bg-warning/15 text-warning border-warning/20"
                            : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col — Sessions Quota + Quick Shortcuts */}
        <div className="space-y-4">
          {/* Sessions Quota Panel */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground">
                  Connected WABridge Channels
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("sessions")}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Inspect Quotas
              </button>
            </div>

            <div className="space-y-2.5">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No sessions configured
                </p>
              ) : (
                sessions.map((session) => {
                  const quota: Pick<
                    SessionRateQuota,
                    "hourlyUsed" | "dailyUsed"
                  > = sessionQuotas[session.id] ?? {
                    hourlyUsed: session.hourlySentTimestamps.length,
                    dailyUsed: session.dailySentTimestamps.length,
                  };
                  return (
                    <div
                      key={session.id}
                      className="p-2.5 rounded-lg bg-muted border border-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate max-w-35">
                          {session.name}
                        </span>
                        <span className="text-[10px] text-success font-mono font-medium">
                          {quota.hourlyUsed}/{session.hourlyLimit} hr •{" "}
                          {quota.dailyUsed}/{session.dailyLimit} day
                        </span>
                      </div>
                      {/* 5-slot hourly grid */}
                      <div className="grid grid-cols-5 gap-1">
                        {[0, 1, 2, 3, 4].map((idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-sm ${
                              idx < quota.hourlyUsed
                                ? "bg-success"
                                : "bg-secondary border border-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Shortcuts Panel */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold text-foreground pb-1 border-b border-border">
              Pharmacy SOP Quick Operations
            </h3>
            {[
              {
                label: "Approved Prescription Templates",
                tab: "templates",
                Icon: FileText,
                iconClass: "text-primary",
              },
              {
                label: "Patient Directory & Phone Verifier",
                tab: "customers",
                Icon: Users,
                iconClass: "text-success",
              },
              {
                label: "Compliance Reports & Audit Logs",
                tab: "reports",
                Icon: TrendingUp,
                iconClass: "text-warning",
              },
            ].map(({ label, tab, Icon, iconClass }) => (
              <button
                key={tab}
                type="button"
                onClick={() => onNavigate(tab)}
                className="w-full p-2.5 rounded-lg bg-muted hover:bg-secondary border border-border text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
                  <span className="text-foreground font-medium">{label}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
