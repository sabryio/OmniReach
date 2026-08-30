import { useQuery } from '@tanstack/react-query'
import { ContactQueryKeys } from '../api/queryKeys'
import { getContacts } from '../api/customers.api'

export function useContactsQuery() {
  const query = useQuery({
    queryKey: ContactQueryKeys.list(),
    queryFn: getContacts,
  })
  return {
    contacts: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}
