import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useQueueQuery() {
  const query = useQuery(
    orpc.queue.list.queryOptions({ input: { campaign_id: null } }),
  );
  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLogsQuery() {
  const query = useQuery(orpc.logs.list.queryOptions());
  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
