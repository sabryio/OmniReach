import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SessionQueryKeys } from "../api/queryKeys";
import {
  createSession,
  deleteSession,
  sendTestMessage,
  checkContact,
  syncSession,
  resetSessionLimits,
} from "../api/sessions.api";

export function useCreateSession() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });
  return {
    createSession: mutation.mutate,
    createSessionAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });
  return {
    deleteSession: mutation.mutate,
    deleteSessionAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export function useSyncSession() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: syncSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });
  return {
    syncSession: mutation.mutate,
    syncSessionAsync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useResetSessionLimits() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: resetSessionLimits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });
  return {
    resetLimits: mutation.mutate,
    resetLimitsAsync: mutation.mutateAsync,
    isResetting: mutation.isPending,
    error: mutation.error,
  };
}

export function useSendTestMessage() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: sendTestMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });
  return {
    sendTestMessage: mutation.mutate,
    sendTestMessageAsync: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useCheckContact() {
  const mutation = useMutation({
    mutationFn: checkContact,
  });
  return {
    checkContact: mutation.mutate,
    checkContactAsync: mutation.mutateAsync,
    isChecking: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}
