import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueueQueryKeys, LogQueryKeys } from "../api/queryKeys";
import { cancelQueueItem, retryQueueItem, clearLogs } from "../api/queue.api";
import { toast } from "sonner";

export function useCancelQueueItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: cancelQueueItem,
    onSuccess: () => {
      toast.success("Queue item cancelled");
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });
  return {
    cancelQueueItem: mutation.mutate,
    isCancelling: mutation.isPending,
    error: mutation.error,
  };
}

export function useRetryQueueItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: retryQueueItem,
    onSuccess: () => {
      toast.success("Queue item requeued for retry");
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
    },
    onError: (error) => {
      toast.error(`Failed to retry: ${error.message}`);
    },
  });
  return {
    retryQueueItem: mutation.mutate,
    isRetrying: mutation.isPending,
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
