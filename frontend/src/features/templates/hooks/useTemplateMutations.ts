import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TemplateQueryKeys } from '../api/queryKeys'
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../api/templates.api'
import type { UpdateTemplateInput } from '../schemas/template.schema'

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
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput }) =>
      updateTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TemplateQueryKeys.all })
    },
  })
  return {
    updateTemplate: mutation.mutate,
    updateTemplateAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
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
    deleteTemplateAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  }
}
