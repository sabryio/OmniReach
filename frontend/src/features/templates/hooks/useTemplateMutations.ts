import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TemplateQueryKeys } from '../api/queryKeys'
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../api/templates.api'
import type { MessageTemplate } from '@/types'

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TemplateQueryKeys.all })
    },
  })
  return {
    createTemplate: mutation.mutate,
    createTemplateAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MessageTemplate> }) =>
      updateTemplate(id, updates),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: TemplateQueryKeys.detail(vars.id) })
      queryClient.invalidateQueries({ queryKey: TemplateQueryKeys.lists() })
    },
  })
  return {
    updateTemplate: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  }
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TemplateQueryKeys.all })
    },
  })
  return {
    deleteTemplate: mutation.mutate,
    isDeleting: mutation.isPending,
    error: mutation.error,
  }
}
