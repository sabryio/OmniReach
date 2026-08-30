import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CampaignQueryKeys } from '../api/queryKeys'
import { QueueQueryKeys } from '@/features/queue/api/queryKeys'
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  pauseCampaign,
  resumeCampaign,
  archiveCampaign,
  unarchiveCampaign,
} from '../api/campaigns.api'
import type { Campaign } from '@/types'

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all })
    },
  })
  return {
    createCampaign: mutation.mutate,
    createCampaignAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) =>
      updateCampaign(id, updates),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.detail(vars.id) })
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.lists() })
    },
  })
  return {
    updateCampaign: mutation.mutate,
    updateCampaignAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  }
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all })
    },
  })
  return {
    deleteCampaign: mutation.mutate,
    deleteCampaignAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  }
}

export function usePauseCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: pauseCampaign,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.lists() })
    },
  })
  return {
    pauseCampaign: mutation.mutate,
    pauseCampaignAsync: mutation.mutateAsync,
    isPausing: mutation.isPending,
    error: mutation.error,
  }
}

export function useResumeCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: resumeCampaign,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.lists() })
    },
  })
  return {
    resumeCampaign: mutation.mutate,
    resumeCampaignAsync: mutation.mutateAsync,
    isResuming: mutation.isPending,
    error: mutation.error,
  }
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: archiveCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all })
    },
  })
  return { archiveCampaign: mutation.mutate, isArchiving: mutation.isPending }
}

export function useUnarchiveCampaign() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: unarchiveCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all })
    },
  })
  return { unarchiveCampaign: mutation.mutate, isUnarchiving: mutation.isPending }
}
