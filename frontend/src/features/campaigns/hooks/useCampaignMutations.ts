import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
        queryClient.invalidateQueries(
          orpc.queue.list.queryOptions({ input: {} }),
        );
      },
    }),
  );

  return {
    createCampaign: mutation.mutate,
    createCampaignAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.destroy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
        // Queue items are CASCADE deleted when campaign is deleted
        queryClient.invalidateQueries(
          orpc.queue.list.queryOptions({ input: {} }),
        );
      },
    }),
  );

  return {
    deleteCampaign: mutation.mutate,
    deleteCampaignAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.pause.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate specific campaign detail
        queryClient.invalidateQueries(
          orpc.campaigns.getById.queryOptions({ input: { id: variables.id } }),
        );
        // Invalidate campaigns list
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
      },
    }),
  );

  return {
    pauseCampaign: mutation.mutate,
    pauseCampaignAsync: mutation.mutateAsync,
    isPausing: mutation.isPending,
    error: mutation.error,
  };
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.resume.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate specific campaign detail
        queryClient.invalidateQueries(
          orpc.campaigns.getById.queryOptions({ input: { id: variables.id } }),
        );
        // Invalidate campaigns list
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
      },
    }),
  );

  return {
    resumeCampaign: mutation.mutate,
    resumeCampaignAsync: mutation.mutateAsync,
    isResuming: mutation.isPending,
    error: mutation.error,
  };
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.archive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
      },
    }),
  );

  return {
    archiveCampaign: mutation.mutate,
    archiveCampaignAsync: mutation.mutateAsync,
    isArchiving: mutation.isPending,
    error: mutation.error,
  };
}

export function useUnarchiveCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.unarchive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
      },
    }),
  );

  return {
    unarchiveCampaign: mutation.mutate,
    unarchiveCampaignAsync: mutation.mutateAsync,
    isUnarchiving: mutation.isPending,
    error: mutation.error,
  };
}

export function useRetryFailedCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.campaigns.retryFailed.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
        queryClient.invalidateQueries(
          orpc.queue.list.queryOptions({ input: {} }),
        );
      },
    }),
  );

  return {
    retryFailedCampaign: mutation.mutate,
    retryFailedCampaignAsync: mutation.mutateAsync,
    isRetrying: mutation.isPending,
    error: mutation.error,
  };
}
