import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CampaignQueryKeys } from "../api/queryKeys";
import { QueueQueryKeys } from "@/features/queue/api/queryKeys";
import {
  createCampaign,
  deleteCampaign,
  pauseCampaign,
  resumeCampaign,
  archiveCampaign,
  unarchiveCampaign,
  retryFailedCampaign,
} from "../api/campaigns.api";

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
    },
  });
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
  const mutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });
      // Queue items are CASCADE deleted when campaign is deleted
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
    },
  });
  return {
    deleteCampaign: mutation.mutate,
    deleteCampaignAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: pauseCampaign,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.lists() });
    },
  });
  return {
    pauseCampaign: mutation.mutate,
    pauseCampaignAsync: mutation.mutateAsync,
    isPausing: mutation.isPending,
    error: mutation.error,
  };
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: resumeCampaign,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.lists() });
    },
  });
  return {
    resumeCampaign: mutation.mutate,
    resumeCampaignAsync: mutation.mutateAsync,
    isResuming: mutation.isPending,
    error: mutation.error,
  };
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: archiveCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });
    },
  });
  return { archiveCampaign: mutation.mutate, isArchiving: mutation.isPending };
}

export function useUnarchiveCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: unarchiveCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });
    },
  });
  return {
    unarchiveCampaign: mutation.mutate,
    isUnarchiving: mutation.isPending,
  };
}

export function useRetryFailedCampaign() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: retryFailedCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
    },
  });
  return {
    retryFailedCampaign: mutation.mutate,
    isRetrying: mutation.isPending,
    error: mutation.error,
  };
}
