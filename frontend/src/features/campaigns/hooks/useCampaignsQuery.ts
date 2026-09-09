import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useCampaignsQuery() {
  const query = useQuery(orpc.campaigns.list.queryOptions());

  return {
    campaigns: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCampaignQuery(id: string) {
  const query = useQuery(
    orpc.campaigns.getById.queryOptions({
      input: { id },
      enabled: !!id,
    }),
  );

  return {
    campaign: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
