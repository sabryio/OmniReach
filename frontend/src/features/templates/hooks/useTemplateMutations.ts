import { orpc } from "@/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.templates.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.templates.list.queryKey(),
        });
      },
    }),
  );
  return {
    createTemplate: mutation.mutate,
    createTemplateAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.templates.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.templates.list.queryKey(),
        });
      },
    }),
  );
  return {
    updateTemplate: mutation.mutate,
    updateTemplateAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.templates.destroy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.templates.list.queryKey(),
        });
      },
    }),
  );
  return {
    deleteTemplate: mutation.mutate,
    deleteTemplateAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
