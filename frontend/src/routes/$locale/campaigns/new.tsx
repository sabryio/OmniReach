import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { CampaignWizard } from "@/features/campaigns";
import { useSessions } from "@/features/sessions/hooks/useSessionsQuery";
import { useCreateCampaign } from "@/features/campaigns/hooks/useCampaignMutations";
import type { Campaign, WABridgeConfig } from "@/types";

const DEFAULT_CONFIG: WABridgeConfig = {
  baseUrl: "http://127.0.0.1:8080",
  timeoutMs: 5000,
  useSimulationMode: true,
  simulatedNetworkLatencyMs: 400,
  simulatedUnregisteredRate: 0.15,
};

export const Route = createFileRoute("/$locale/campaigns/new")({
  component: NewCampaignRoute,
});

function NewCampaignRoute() {
  const navigate = useNavigate();
  const { locale } = useParams({ from: "/$locale/campaigns/new" });
  const { sessions } = useSessions();
  const { createCampaignAsync } = useCreateCampaign();

  const handleLaunchCampaign = async (campaign: Campaign) => {
    await createCampaignAsync({
      title: campaign.title,
      template: {
        id: "",
        title: "",
        category: "",
        text: campaign.templateText ?? "",
        suggestedVariables: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      contacts: campaign.contacts ?? [],
      sessionIds: [],
    });
    navigate({ to: "/$locale/campaigns", params: { locale } });
  };

  return (
    <CampaignWizard
      sessions={sessions}
      config={DEFAULT_CONFIG}
      initialTemplate={null}
      initialContacts={null}
      onLaunchCampaign={handleLaunchCampaign}
      onCancel={() =>
        navigate({ to: "/$locale/campaigns", params: { locale } })
      }
    />
  );
}
