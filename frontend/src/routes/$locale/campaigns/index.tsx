import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { CampaignsList } from "@/features/campaigns";
import { useCampaignsQuery } from "@/features/campaigns/hooks/useCampaignsQuery";
import { useQueueQuery } from "@/features/queue/hooks/useQueueQuery";
import { useSessions } from "@/features/sessions/hooks/useSessionsQuery";
import {
  usePauseCampaign,
  useResumeCampaign,
  useDeleteCampaign,
  useArchiveCampaign,
  useUnarchiveCampaign,
  useRetryFailedCampaign,
} from "@/features/campaigns/hooks/useCampaignMutations";

export const Route = createFileRoute("/$locale/campaigns/")({
  component: CampaignsRoute,
});

function CampaignsRoute() {
  const navigate = useNavigate();
  const { locale } = useParams({ from: "/$locale/campaigns/" });

  const { campaigns, isLoading } = useCampaignsQuery();
  const { queue } = useQueueQuery();
  const { sessions } = useSessions();
  const { pauseCampaign } = usePauseCampaign();
  const { resumeCampaign } = useResumeCampaign();
  const { deleteCampaign } = useDeleteCampaign();
  const { archiveCampaign } = useArchiveCampaign();
  const { unarchiveCampaign } = useUnarchiveCampaign();
  const { retryFailedCampaign } = useRetryFailedCampaign();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading campaigns...
      </div>
    );
  }

  return (
    <CampaignsList
      campaigns={campaigns}
      queue={queue}
      sessions={sessions}
      onPauseCampaign={(id) => pauseCampaign(id)}
      onResumeCampaign={(id) => resumeCampaign(id)}
      onRetryFailed={(id) => retryFailedCampaign(id)}
      onDeleteCampaign={(id) => deleteCampaign(id)}
      onArchiveCampaign={(id) => archiveCampaign(id)}
      onUnarchiveCampaign={(id) => unarchiveCampaign(id)}
      onNewCampaignClick={() =>
        navigate({ to: "/$locale/campaigns/new", params: { locale } })
      }
    />
  );
}
