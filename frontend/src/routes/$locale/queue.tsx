import { createFileRoute } from "@tanstack/react-router";
import { QueueAndLogsView } from "@/features/queue";
import {
  useQueueQuery,
  useLogsQuery,
} from "@/features/queue/hooks/useQueueQuery";
import { useCancelQueueItem } from "@/features/queue/hooks/useQueueMutations";
import type { SchedulerState } from "@/features/layout/schemas/layout.schema";
import { useState } from "react";

const DEFAULT_SCHEDULER: SchedulerState = {
  isRunning: false,
  isProcessingTick: false,
  isWithinTimeWindow: true,
  timeWindowText: "9AM-9PM Active",
  currentLocalTimeStr: new Date().toLocaleTimeString(),
  activeSendingCount: 0,
  totalQueuePending: 0,
  totalQueueHeld: 0,
  strictTimeWindow: true,
  customWindowStartHour: 9,
  customWindowEndHour: 21,
  simulatedHourOffset: 0,
};

export const Route = createFileRoute("/$locale/queue")({
  component: QueueRoute,
});

function QueueRoute() {
  const { queue, isLoading: queueLoading } = useQueueQuery();
  const { logs, isLoading: logsLoading } = useLogsQuery();
  const { cancelQueueItem } = useCancelQueueItem();
  const [schedulerState] = useState<SchedulerState>(DEFAULT_SCHEDULER);

  // Show loading only if QUEUE is loading (logs can load in background)
  if (queueLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading queue...
      </div>
    );
  }

  return (
    <QueueAndLogsView
      queue={queue}
      logs={logs}
      schedulerState={schedulerState}
      onClearLogs={() => {}}
      onCancelItem={(id) => cancelQueueItem(id)}
    />
  );
}
