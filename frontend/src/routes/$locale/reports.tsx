import { createFileRoute } from "@tanstack/react-router";
import { ReportsView } from "@/features/reports";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import type { SchedulerState } from "@/features/layout/schemas/layout.schema";
import { useState } from "react";

const DEFAULT_SCHEDULER: SchedulerState = {
  isRunning: false,
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

export const Route = createFileRoute("/$locale/reports")({
  component: ReportsRoute,
});

function ReportsRoute() {
  const { campaigns, sessions, queue, logs, isLoading } = useDashboardData();
  const [schedulerState] = useState<SchedulerState>(DEFAULT_SCHEDULER);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading reports...
      </div>
    );
  }

  return (
    <ReportsView
      campaigns={campaigns}
      queue={queue}
      sessions={sessions}
      logs={logs}
      schedulerState={schedulerState}
    />
  );
}
