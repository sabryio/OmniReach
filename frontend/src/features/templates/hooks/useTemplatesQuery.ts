import { useQuery } from '@tanstack/react-query'
import { TemplateQueryKeys } from '../api/queryKeys'
import { getTemplates, getTemplate } from '../api/templates.api'

export function useTemplatesQuery() {
  const query = useQuery({
    queryKey: TemplateQueryKeys.list(),
    queryFn: getTemplates,
  })
  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useTemplateQuery(id: string) {
  const query = useQuery({
    queryKey: TemplateQueryKeys.detail(id),
    queryFn: () => getTemplate(id),
    enabled: !!id,
  })
  return {
    template: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
