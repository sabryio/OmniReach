import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useCreateSession() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.sessions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

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
  const mutation = useMutation(
    orpc.sessions.destroy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

  return {
    deleteSession: mutation.mutate,
    deleteSessionAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export function useSyncSession() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.sessions.sync.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate specific session detail
        queryClient.invalidateQueries(
          orpc.sessions.getById.queryOptions({ input: { id: variables.id } }),
        );
        // Invalidate sessions list
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

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
  const mutation = useMutation(
    orpc.sessions.resetLimits.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate specific session detail
        queryClient.invalidateQueries(
          orpc.sessions.getById.queryOptions({ input: { id: variables.id } }),
        );
        // Invalidate sessions list
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

  return {
    resetLimits: mutation.mutate,
    resetLimitsAsync: mutation.mutateAsync,
    isResetting: mutation.isPending,
    error: mutation.error,
  };
}

export function useSendTestMessage() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.sessions.sendTest.mutationOptions({
      onSuccess: () => {
        // Test message doesn't modify session state, but refresh list anyway
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

  return {
    sendTestMessage: mutation.mutate,
    sendTestMessageAsync: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.sessions.update.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate specific session detail
        queryClient.invalidateQueries(
          orpc.sessions.getById.queryOptions({ input: { id: variables.id } }),
        );
        // Invalidate sessions list
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

  return {
    updateSession: mutation.mutate,
    updateSessionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
