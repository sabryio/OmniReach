import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CustomersView } from "@/features/customers";
import { useCustomerManager } from "@/features/customers/hooks/useCustomers";
import { useSessions } from "@/features/sessions/hooks/useSessionsQuery";
import { useCampaignsQuery } from "@/features/campaigns/hooks/useCampaignsQuery";
import { useModals } from "@/features/modals";

export const Route = createFileRoute("/$locale/customers")({
  component: CustomersRoute,
});

function CustomersRoute() {
  const navigate = useNavigate();
  const { locale } = Route.useParams();
  const { sessions } = useSessions();
  const { campaigns } = useCampaignsQuery();
  const modals = useModals();

  // Aggregate contacts from all campaigns as the initial data source
  // TODO: Phase 2 — replace with useContactsQuery() once GET /api/contacts returns real data
  const campaignContacts = campaigns.flatMap((c) => c.contacts ?? []);

  const manager = useCustomerManager(campaignContacts, sessions);

  return (
    <CustomersView
      {...manager}
      onLaunchCampaignWithContacts={() => {
        navigate({ to: "/$locale/campaigns/new", params: { locale } });
      }}
      onOpenVerifier={modals.openVerifier}
    />
  );
}
