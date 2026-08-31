import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SettingsQueryKeys } from "../api/queryKeys";
import { updateSettings } from "../api/settings.api";

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SettingsQueryKeys.all });
    },
  });
  return {
    updateSettings: mutation.mutate,
    updateSettingsAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
