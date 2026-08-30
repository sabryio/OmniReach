import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueueQueryKeys, LogQueryKeys } from '../api/queryKeys'
import { deleteQueueItem, retryQueueItem, clearLogs } from '../api/queue.api'

export function useDeleteQueueItem() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: deleteQueueItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all })
    },
  })
  return {
    deleteQueueItem: mutation.mutate,
    isDeleting: mutation.isPending,
    error: mutation.error,
  }
}

export function useRetryQueueItem() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: retryQueueItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all })
    },
  })
  return {
    retryQueueItem: mutation.mutate,
    isRetrying: mutation.isPending,
    error: mutation.error,
  }
}

export function useClearLogs() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LogQueryKeys.all })
    },
  })
  return {
    clearLogs: mutation.mutate,
    isClearing: mutation.isPending,
    error: mutation.error,
  }
}
