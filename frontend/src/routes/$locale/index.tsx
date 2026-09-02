import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { DashboardView } from "@/features/dashboard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useState, useCallback } from "react";
import type { SchedulerState } from "@/features/layout/schemas/layout.schema";

export const Route = createFileRoute("/$locale/")({
  component: DashboardRoute,
});

const DEFAULT_SCHEDULER: SchedulerState = {
  isRunning: false,
  isProcessingTick: false,
  isWithinTimeWindow: true,
  timeWindowText: "9AM–9PM Active",
  currentLocalTimeStr: new Date().toLocaleTimeString(),
  activeSendingCount: 0,
  totalQueuePending: 0,
  totalQueueHeld: 0,
  strictTimeWindow: true,
  customWindowStartHour: 9,
  customWindowEndHour: 21,
  simulatedHourOffset: 0,
};

function DashboardRoute() {
  const navigate = useNavigate();
  const { locale } = useParams({ from: "/$locale/" });
  const { campaigns, sessions, queue, logs, isLoading } = useDashboardData();
  const [schedulerState, setSchedulerState] =
    useState<SchedulerState>(DEFAULT_SCHEDULER);

  const handleToggleScheduler = useCallback(() => {
    setSchedulerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <DashboardView
      campaigns={campaigns}
      queue={queue}
      sessions={sessions}
      schedulerState={schedulerState}
      logs={logs}
      onNavigate={(tab) =>
        navigate({
          to: `/$locale/${tab}`,
          params: (p) => p,
        })
      }
      onNewCampaignClick={() =>
        navigate({ to: "/$locale/campaigns/new", params: { locale } })
      }
      onToggleScheduler={handleToggleScheduler}
    />
  );
}
