import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TemplatesView } from "@/features/templates";
import { useTemplatesQuery } from "@/features/templates/hooks/useTemplatesQuery";
import { useTemplateManager } from "@/features/templates/hooks/useTemplates";

export const Route = createFileRoute("/$locale/templates")({
  component: TemplatesRoute,
});

function TemplatesRoute() {
  const navigate = useNavigate();
  const { locale } = Route.useParams();
  const { templates: queryTemplates, isLoading } = useTemplatesQuery();

  // UI state hook receives initial data from TanStack Query
  const manager = useTemplateManager(queryTemplates);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading templates...
      </div>
    );
  }

  return (
    <TemplatesView
      {...manager}
      defaultTemplates={queryTemplates}
      onUseTemplateInCampaign={() => {
        navigate({ to: "/$locale/campaigns/new", params: { locale } });
      }}
    />
  );
}
