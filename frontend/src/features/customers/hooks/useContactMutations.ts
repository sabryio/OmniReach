import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ContactQueryKeys } from '../api/queryKeys'
import {
  createContact,
  deleteContact,
  verifyContact,
} from '../api/customers.api'

export function useCreateContact() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ContactQueryKeys.all })
    },
  })
  return {
    createContact: mutation.mutate,
    createContactAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ContactQueryKeys.all })
    },
  })
  return {
    deleteContact: mutation.mutate,
    isDeleting: mutation.isPending,
    error: mutation.error,
  }
}

export function useVerifyContact() {
  const mutation = useMutation({
    mutationFn: verifyContact,
  })
  return {
    verifyContact: mutation.mutate,
    verifyContactAsync: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  }
}
