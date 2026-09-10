import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TemplatesView, useTemplateManager } from "@/features/templates";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/features/templates";
import type { Template } from "@/rpc/bindings";

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

  // UI state layer — pass templates from query and mutations explicitly
  // Wrap mutations to match the structure expected by useTemplateManager
  const templateManager = useTemplateManager(templates, {
    createTemplateAsync,
    updateTemplateAsync: async (params) => {
      // Transform { id, input: {...} } to { id, ...input }
      return updateTemplateAsync({ id: params.id, ...params.input });
    },
    deleteTemplateAsync: async (id) => {
      // Transform string id to { id }
      return deleteTemplateAsync({ id });
    },
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
      onUseTemplateInCampaign={handleUseTemplateInCampaign}
    />
  );
}
