import { useQuery } from "@tanstack/react-query";
import { QueueQueryKeys, LogQueryKeys } from "../api/queryKeys";
import { getQueue, getLogs } from "../api/queue.api";

export function useQueueQuery() {
  const query = useQuery({
    queryKey: QueueQueryKeys.list(),
    queryFn: () => getQueue(),
  });
  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLogsQuery() {
  const query = useQuery({
    queryKey: LogQueryKeys.list(),
    queryFn: getLogs,
  });
  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
