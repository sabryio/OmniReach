import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useSessions() {
  const query = useQuery(orpc.sessions.list.queryOptions());
  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSession(id: string) {
  const query = useQuery(orpc.sessions.getById.queryOptions({ input: { id } }));
  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
