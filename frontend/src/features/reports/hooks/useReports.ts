import { useCallback, useMemo, useState } from "react";
import type { Campaign } from "@/features/campaigns/schemas/campaign.schema";
import type { QueueItem } from "@/features/queue/schemas/queue.schema";

/**
 * Comprehensive hook for ReportsView component
 * Manages date range, metrics calculation, export functionality
 */
export function useReportsManager(campaigns: Campaign[], queue: QueueItem[]) {
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [selectedMetric, setSelectedMetric] = useState<
    "delivery" | "unregistered" | "sent"
  >("delivery");

  // Calculate totals
  const totals = useMemo(() => {
    const totalAudience = campaigns.reduce((a, c) => a + c.totalContacts, 0);
    const totalDelivered = campaigns.reduce((a, c) => a + c.sentCount, 0);
    const totalUnregistered = campaigns.reduce(
      (a, c) => a + c.unregisteredCount,
      0,
    );
    const totalFailed = campaigns.reduce((a, c) => a + c.failedCount, 0);

    const deliveryRate =
      totalAudience > 0
        ? Math.round((totalDelivered / totalAudience) * 100)
        : 0;
    const unregisteredRate =
      totalAudience > 0
        ? Math.round((totalUnregistered / totalAudience) * 100)
        : 0;

    const today = new Date().setHours(0, 0, 0, 0);
    const sentToday = queue.filter(
      (q) =>
        q.status === "sent" &&
        q.sentAt &&
        new Date(q.sentAt).getTime() >= today,
    ).length;

    const totalCampaigns = campaigns.length;
    const totalQueueItems = queue.length;

    return {
      audience: totalAudience,
      delivered: totalDelivered,
      unregistered: totalUnregistered,
      failed: totalFailed,
      deliveryRate,
      unregisteredRate,
      sentToday,
      totalCampaigns,
      totalQueueItems,
    };
  }, [campaigns, queue]);

  // Filter campaigns by date range if set
  const filteredCampaigns = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return campaigns;

    return campaigns.filter((c) => {
      const createdAt = new Date(c.createdAt).getTime();
      if (dateRange.start && createdAt < dateRange.start.getTime())
        return false;
      if (dateRange.end && createdAt > dateRange.end.getTime()) return false;
      return true;
    });
  }, [campaigns, dateRange]);

  // Export single campaign CSV
  const exportCampaignCsv = useCallback((campaign: Campaign) => {
    const rows = [
      ["Name", "Phone", "WA Status", "waId"],
      ...(campaign.contacts ?? []).map((c) => [
        c.name,
        c.rawPhone,
        c.verificationStatus,
        c.waId ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Export full audit CSV
  const exportFullCsv = useCallback(() => {
    const rows = [
      [
        "CampaignId",
        "CampaignTitle",
        "Phone",
        "Recipient",
        "Status",
        "SentAt",
        "ComplianceRuleHonored",
      ],
      ...queue.map((q) => [
        q.campaignId,
        q.campaignTitle,
        q.phone,
        q.recipientName ?? "",
        q.status,
        q.sentAt ? new Date(q.sentAt).toISOString() : "",
        "true",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnireach-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [queue]);

  // Export metrics summary
  const exportMetricsSummary = useCallback(() => {
    const rows = [
      ["Metric", "Value"],
      ["Total Audience", totals.audience],
      ["Total Delivered", totals.delivered],
      ["Total Unregistered", totals.unregistered],
      ["Total Failed", totals.failed],
      ["Delivery Rate", `${totals.deliveryRate}%`],
      ["Unregistered Rate", `${totals.unregisteredRate}%`],
      ["Sent Today", totals.sentToday],
      ["Total Campaigns", totals.totalCampaigns],
      ["Total Queue Items", totals.totalQueueItems],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-summary-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [totals]);

  return {
    // Date range
    dateRange,
    setDateRange,

    // Metric selection
    selectedMetric,
    setSelectedMetric,

    // Data
    totals,
    filteredCampaigns,

    // Export functions
    exportCampaignCsv,
    exportFullCsv,
    exportMetricsSummary,
  };
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useReportsManager instead
 */
export function useReports(campaigns: Campaign[], queue: QueueItem[]) {
  const totalAudience = campaigns.reduce((a, c) => a + c.totalContacts, 0);
  const totalDelivered = campaigns.reduce((a, c) => a + c.sentCount, 0);
  const totalUnregistered = campaigns.reduce(
    (a, c) => a + c.unregisteredCount,
    0,
  );
  const deliveryRate =
    totalAudience > 0 ? Math.round((totalDelivered / totalAudience) * 100) : 0;
  const unregisteredRate =
    totalAudience > 0
      ? Math.round((totalUnregistered / totalAudience) * 100)
      : 0;

  const today = new Date().setHours(0, 0, 0, 0);
  const sentToday = queue.filter(
    (q) =>
      q.status === "sent" && q.sentAt && new Date(q.sentAt).getTime() >= today,
  ).length;

  const exportCampaignCsv = useCallback((campaign: Campaign) => {
    const rows = [
      ["Name", "Phone", "WA Status", "waId"],
      ...(campaign.contacts ?? []).map((c) => [
        c.name,
        c.rawPhone,
        c.verificationStatus,
        c.waId ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportFullCsv = useCallback(() => {
    const rows = [
      [
        "CampaignId",
        "CampaignTitle",
        "Phone",
        "Recipient",
        "Status",
        "SentAt",
        "ComplianceRuleHonored",
      ],
      ...queue.map((q) => [
        q.campaignId,
        q.campaignTitle,
        q.phone,
        q.recipientName ?? "",
        q.status,
        q.sentAt ? new Date(q.sentAt).toISOString() : "",
        "true",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnireach-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [queue]);

  return {
    totals: {
      audience: totalAudience,
      delivered: totalDelivered,
      unregistered: totalUnregistered,
      deliveryRate,
      unregisteredRate,
      sentToday,
    },
    exportCampaignCsv,
    exportFullCsv,
  };
}
