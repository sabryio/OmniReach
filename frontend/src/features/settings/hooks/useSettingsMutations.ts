import { orpc } from "@/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.settings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.settings.load.queryOptions());
      },
    }),
  );
  return {
    updateSettings: mutation.mutate,
    updateSettingsAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
