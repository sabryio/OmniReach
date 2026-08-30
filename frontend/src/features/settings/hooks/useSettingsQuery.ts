import { useQuery } from '@tanstack/react-query'
import { SettingsQueryKeys } from '../api/queryKeys'
import { getSettings } from '../api/settings.api'

export function useSettingsQuery() {
  const query = useQuery({
    queryKey: SettingsQueryKeys.config(),
    queryFn: getSettings,
  })
  return {
    config: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
