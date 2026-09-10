import { orpc } from "@/rpc";
import { useQuery } from "@tanstack/react-query";

export function useTemplates() {
  const query = useQuery(orpc.templates.list.queryOptions());
  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTemplate(id: string) {
  const query = useQuery(
    orpc.templates.getById.queryOptions({ input: { id } }),
  );
  return {
    template: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
