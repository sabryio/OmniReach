import { useQuery } from '@tanstack/react-query'
import { SessionQueryKeys } from '../api/queryKeys'
import { getSessions, getSession } from '../api/sessions.api'

export function useSessions() {
  const query = useQuery({
    queryKey: SessionQueryKeys.list(),
    queryFn: getSessions,
  })
  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useSession(id: string) {
  const query = useQuery({
    queryKey: SessionQueryKeys.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
  })
  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
