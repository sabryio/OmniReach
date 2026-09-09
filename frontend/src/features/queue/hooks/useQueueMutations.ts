import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/rpc";
import { toast } from "sonner";

export function useCancelQueueItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.queue.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Queue item cancelled");
        queryClient.invalidateQueries(
          orpc.queue.list.queryOptions({ input: {} }),
        );
        queryClient.invalidateQueries(orpc.queue.stats.queryOptions());
      },
      onError: (error) => {
        toast.error(`Failed to cancel: ${error.message}`);
      },
    }),
  );

  return {
    cancelQueueItem: mutation.mutate,
    cancelQueueItemAsync: mutation.mutateAsync,
    isCancelling: mutation.isPending,
    error: mutation.error,
  };
}

export function useRetryQueueItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.queue.retry.mutationOptions({
      onSuccess: () => {
        toast.success("Queue item requeued for retry");
        queryClient.invalidateQueries(
          orpc.queue.list.queryOptions({ input: {} }),
        );
        queryClient.invalidateQueries(orpc.queue.stats.queryOptions());
      },
      onError: (error) => {
        toast.error(`Failed to retry: ${error.message}`);
      },
    }),
  );

  return {
    retryQueueItem: mutation.mutate,
    retryQueueItemAsync: mutation.mutateAsync,
    isRetrying: mutation.isPending,
    error: mutation.error,
  };
}

export function useClearLogs() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.logs.clear.mutationOptions({
      onSuccess: () => {
        toast.success("Logs cleared");
        queryClient.invalidateQueries(orpc.logs.list.queryOptions());
      },
      onError: (error) => {
        toast.error(`Failed to clear logs: ${error.message}`);
      },
    }),
  );

  return {
    clearLogs: mutation.mutate,
    clearLogsAsync: mutation.mutateAsync,
    isClearing: mutation.isPending,
    error: mutation.error,
  };
}
