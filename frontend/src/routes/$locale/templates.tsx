import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TemplatesView, useTemplateManager } from "@/features/templates";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/features/templates";
import type { Template } from "@/features/templates";

export const Route = createFileRoute("/$locale/templates")({
  component: TemplatesRoute,
});

function TemplatesRoute() {
  const navigate = useNavigate();
  const { locale } = Route.useParams();

  // Data layer — TanStack Query
  const { templates, isLoading } = useTemplates();

  // Mutation hooks
  const { createTemplateAsync } = useCreateTemplate();
  const { updateTemplateAsync } = useUpdateTemplate();
  const { deleteTemplateAsync } = useDeleteTemplate();

  // UI state layer — pass mutations explicitly
  const templateManager = useTemplateManager(templates, {
    createTemplateAsync,
    updateTemplateAsync,
    deleteTemplateAsync,
  });

  const handleUseTemplateInCampaign = (template: Template) => {
    navigate({
      to: "/$locale/campaigns/new",
      params: { locale },
      search: { templateId: template.id },
    });
  };

  if (isLoading) {
    return <div className="p-5">Loading templates...</div>;
  }

  return (
    <TemplatesView
      {...templateManager}
      defaultTemplates={templates}
      onUseTemplateInCampaign={handleUseTemplateInCampaign}
    />
  );
}
