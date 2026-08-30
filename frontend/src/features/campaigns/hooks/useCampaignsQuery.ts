import { useQuery } from '@tanstack/react-query'
import { CampaignQueryKeys } from '../api/queryKeys'
import { getCampaigns, getCampaign } from '../api/campaigns.api'

export function useCampaignsQuery() {
  const query = useQuery({
    queryKey: CampaignQueryKeys.list(),
    queryFn: getCampaigns,
  })
  return {
    campaigns: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCampaignQuery(id: string) {
  const query = useQuery({
    queryKey: CampaignQueryKeys.detail(id),
    queryFn: () => getCampaign(id),
    enabled: !!id,
  })
  return {
    campaign: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
