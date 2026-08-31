import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueueQueryKeys, LogQueryKeys } from "../api/queryKeys";
import { cancelQueueItem, clearLogs } from "../api/queue.api";

export function useCancelQueueItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: cancelQueueItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
    },
  });
  return {
    cancelQueueItem: mutation.mutate,
    isCancelling: mutation.isPending,
    error: mutation.error,
  };
}

export function useClearLogs() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LogQueryKeys.all });
    },
  });
  return {
    clearLogs: mutation.mutate,
    isClearing: mutation.isPending,
    error: mutation.error,
  };
}
