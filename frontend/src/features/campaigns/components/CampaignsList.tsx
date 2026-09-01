/**
 * CampaignsList — master-detail split pane matching mockup structure
 * Styled with shadcn CSS variables via Tailwind utilities
 * REFACTORED: All state logic extracted to useCampaignsList hook.
 * Component is now purely presentational, receiving data and callbacks.
 */
import {
  Layers,
  Search,
  Plus,
  Pause,
  Play,
  Archive,
  ArchiveRestore,
  Trash2,
  Users,
  Download,
  Inbox,
  RotateCcw,
} from "lucide-react";
import type { Campaign } from "@/features/campaigns/schemas/campaign.schema";
import type { Session } from "@/features/sessions/schemas/session.schema";
import { useCampaignsList } from "../hooks/useCampaigns";
import type { QueueItem } from "@/features/queue/schemas/queue.schema";
import { exportCampaignCsv } from "../lib/export";

interface CampaignsListProps {
  campaigns: Campaign[];
  queue: QueueItem[];
  sessions: Session[];
  onPauseCampaign: (id: string) => void;
  onResumeCampaign: (id: string) => void;
  onRetryFailed: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  onArchiveCampaign: (id: string) => void;
  onUnarchiveCampaign: (id: string) => void;
  onNewCampaignClick: () => void;
}

export function CampaignsList({
  campaigns,
  queue,
  onPauseCampaign,
  onResumeCampaign,
  onRetryFailed,
  onDeleteCampaign,
  onArchiveCampaign,
  onUnarchiveCampaign,
  onNewCampaignClick,
}: CampaignsListProps) {
  const {
    viewTab,
    activeCampaigns,
    archivedCampaigns,
    switchToActiveTab,
    switchToArchivedTab,
    campaignSearch,
    setCampaignSearch,
    statusFilter,
    setStatusFilter,
    filteredCampaigns,
    setSelectedCampaignId,
    selectedCampaign,
    selectedCampaignQueue,
    contactSearchQuery,
    setContactSearchQuery,
    recipientStatusFilter,
    setRecipientStatusFilter,
    filteredContacts,
  } = useCampaignsList(campaigns, queue);

  if (campaigns.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 px-4 bg-card border border-border rounded-xl shadow-md">
        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-foreground">
          No Broadcast Campaigns Yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-5">
          Create your first campaign to start broadcasting messages to your
          audience
        </p>
        <button
          type="button"
          onClick={onNewCampaignClick}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-full h-full flex flex-col">
      {/* Top Action Ribbon */}
      <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-foreground">
                Broadcast Campaigns
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono border border-border">
                {activeCampaigns.length} Active • {archivedCampaigns.length}{" "}
                Archived
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Manage and monitor your WhatsApp broadcast campaigns
            </p>
          </div>
        </div>

        {/* View Tabs (Active vs Archived) + New Campaign Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={switchToActiveTab}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewTab === "active"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Active ({activeCampaigns.length})</span>
            </button>

            <button
              type="button"
              onClick={switchToArchivedTab}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewTab === "archived"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archived ({archivedCampaigns.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNewCampaignClick}
            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* MASTER-DETAIL SPLIT PANE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* LEFT PANE: CAMPAIGN MASTER LIST (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 min-h-0">
          {/* Search & Filter Bar */}
          <div className="bg-card border border-border rounded-xl p-2.5 space-y-2 shadow-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search campaigns by title or ID..."
                className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {campaignSearch && (
                <button
                  type="button"
                  onClick={() => setCampaignSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] no-scrollbar">
              {(
                ["all", "running", "paused", "completed", "draft"] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-lg font-semibold capitalize transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {st === "all" ? "All" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Campaign Items List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 min-h-0">
            {filteredCampaigns.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-xl space-y-2">
                {viewTab === "archived" ? (
                  <>
                    <Archive className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-xs font-medium text-foreground">
                      No Archived Campaigns
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      You can archive completed campaigns to keep your active
                      list clean.
                    </p>
                  </>
                ) : (
                  <>
                    <Inbox className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-xs font-medium text-foreground">
                      No Campaigns Found
                    </p>
                    <button
                      type="button"
                      onClick={onNewCampaignClick}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Create New Campaign
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredCampaigns.map((c) => {
                const isSelected = selectedCampaign?.id === c.id;
                const total = c.totalContacts || 1;
                const sent = c.sentCount || 0;
                const percent = Math.round((sent / total) * 100);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 group ${
                      isSelected
                        ? "bg-primary/5 border-primary/40 shadow-md ring-1 ring-primary/20"
                        : "bg-card border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-xs font-bold text-foreground truncate">
                          {c.title}
                        </h3>
                        {c.isArchived && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 font-semibold shrink-0">
                            Archived
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          c.status === "running"
                            ? "bg-success/15 text-success border border-success/30"
                            : c.status === "completed"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : c.status === "paused"
                                ? "bg-warning/15 text-warning border border-warning/30"
                                : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Progress: {percent}%</span>
                        <span>
                          {sent} / {total} sent
                        </span>
                      </div>
                      <div className="w-full bg-muted/80 h-1.5 rounded-full overflow-hidden flex border border-border/50">
                        <div
                          className="bg-success h-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                        {c.unregisteredCount > 0 && (
                          <div
                            className="bg-warning h-full"
                            style={{
                              width: `${(c.unregisteredCount / total) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span className="font-mono">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {c.isArchived ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnarchiveCampaign(c.id);
                            }}
                            className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <ArchiveRestore className="w-3 h-3" />
                            <span>Unarchive</span>
                          </button>
                        ) : (
                          c.status === "completed" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchiveCampaign(c.id);
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-0.5"
                            >
                              <Archive className="w-3 h-3" />
                              <span>Archive</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: DETAIL INSPECTOR & RECIPIENTS BREAKDOWN (7 Cols) */}
        <div className="lg:col-span-7 min-h-0">
          {selectedCampaign ? (
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4 h-full flex flex-col">
              {/* Campaign Inspector Header & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground">
                      {selectedCampaign.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedCampaign.status === "running"
                          ? "bg-success/15 text-success border border-success/30"
                          : selectedCampaign.status === "completed"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-warning/15 text-warning border border-warning/30"
                      }`}
                    >
                      {selectedCampaign.status}
                    </span>

                    {selectedCampaign.isArchived && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/15 text-warning border border-warning/30 flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        <span>Archived</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ID:{" "}
                    <code className="font-mono text-primary">
                      {selectedCampaign.id}
                    </code>{" "}
                    • {new Date(selectedCampaign.createdAt).toLocaleString()}
                    {selectedCampaign.archivedAt && (
                      <span className="ml-2 text-muted-foreground">
                        (Archived at:{" "}
                        {new Date(
                          selectedCampaign.archivedAt,
                        ).toLocaleDateString()}
                        )
                      </span>
                    )}
                  </p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedCampaign.status === "running" ? (
                    <button
                      type="button"
                      onClick={() => onPauseCampaign(selectedCampaign.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning text-xs font-semibold border border-warning/30 flex items-center gap-1 transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  ) : selectedCampaign.status === "paused" ? (
                    <button
                      type="button"
                      onClick={() => onResumeCampaign(selectedCampaign.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-success hover:bg-success/90 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  ) : null}

                  {selectedCampaign.failedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onRetryFailed(selectedCampaign.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-primary text-xs font-semibold border border-border flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry ({selectedCampaign.failedCount})</span>
                    </button>
                  )}

                  {/* Archive / Unarchive Action */}
                  {selectedCampaign.isArchived ? (
                    <button
                      type="button"
                      onClick={() => onUnarchiveCampaign(selectedCampaign.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold border border-primary/20 flex items-center gap-1 transition-colors"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Unarchive</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onArchiveCampaign(selectedCampaign.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold border border-border flex items-center gap-1 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => exportCampaignCsv(selectedCampaign)}
                    className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-warning" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete campaign "${selectedCampaign.title}" permanently?`,
                        )
                      ) {
                        onDeleteCampaign(selectedCampaign.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-muted hover:bg-destructive/15 text-destructive text-xs font-semibold border border-border hover:border-destructive/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metric Breakdown Tiles */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                    Total Recipients
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {selectedCampaign.totalContacts.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                    Sent Success
                  </span>
                  <span className="font-mono font-bold text-success text-sm">
                    {selectedCampaign.sentCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                    Unregistered
                  </span>
                  <span className="font-mono font-bold text-warning text-sm">
                    {selectedCampaign.unregisteredCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                    Failed
                  </span>
                  <span className="font-mono font-bold text-destructive text-sm">
                    {selectedCampaign.failedCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Template & Rendered Sample */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Message & Image Template
                  </span>
                  {selectedCampaign.imageUrl && (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                      ✓ Photo Attached
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border text-foreground font-sans leading-relaxed flex gap-3 shadow-sm">
                  {selectedCampaign.imageUrl && (
                    <img
                      src={selectedCampaign.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-border/50 shrink-0 shadow-sm"
                    />
                  )}
                  <p className="flex-1 text-xs whitespace-pre-wrap text-foreground/90 leading-[1.6]">
                    {selectedCampaign.templateText}
                  </p>
                </div>
              </div>

              {/* Recipient Roster Table */}
              <div className="flex-1 space-y-2 pt-2 border-t border-border/60 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Recipients (
                      {(
                        selectedCampaign.contacts?.length ?? 0
                      ).toLocaleString()}
                      )
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <select
                      value={recipientStatusFilter}
                      onChange={(e) => setRecipientStatusFilter(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-muted/50 border border-border text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all">All</option>
                      <option value="sent">Sent</option>
                      <option value="pending">Pending</option>
                      <option value="skipped">Skipped</option>
                      <option value="failed">Failed</option>
                    </select>

                    <input
                      type="text"
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search recipients..."
                      className="px-2 py-1 rounded-lg bg-muted/50 border border-border text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-36"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 min-h-0">
                  {filteredContacts.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No recipients found
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">
                            Name
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold">
                            Phone
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold">
                            Verification
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 bg-card">
                        {filteredContacts.map((c) => {
                          const qItem = selectedCampaignQueue.find(
                            (q) => q.contactId === c.id,
                          );
                          return (
                            <tr
                              key={c.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-3 text-foreground font-medium">
                                {c.name}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground font-mono">
                                {c.rawPhone}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] capitalize font-semibold border ${
                                    c.verificationStatus === "registered"
                                      ? "bg-success/10 text-success border-success/30"
                                      : c.verificationStatus === "unregistered"
                                        ? "bg-destructive/10 text-destructive border-destructive/30"
                                        : "bg-muted text-muted-foreground border-border"
                                  }`}
                                >
                                  {c.verificationStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] capitalize font-semibold border ${
                                    qItem?.status === "sent"
                                      ? "bg-success/10 text-success border-success/30"
                                      : qItem?.status === "failed"
                                        ? "bg-destructive/10 text-destructive border-destructive/30"
                                        : qItem?.status === "pending" ||
                                            qItem?.status === "held_rate_limit"
                                          ? "bg-warning/10 text-warning border-warning/30"
                                          : "bg-muted text-muted-foreground border-border"
                                  }`}
                                >
                                  {qItem?.status || "pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl h-full flex items-center justify-center shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted border border-border flex items-center justify-center">
                  <Layers className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No Campaign Selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Select a campaign from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
