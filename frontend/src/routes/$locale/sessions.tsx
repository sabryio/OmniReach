import { createFileRoute } from "@tanstack/react-router";
import { SessionsDashboard } from "@/features/sessions";
import { useSessions } from "@/features/sessions/hooks/useSessionsQuery";
import type { WABridgeConfig } from "@/types";

const DEFAULT_CONFIG: WABridgeConfig = {
  baseUrl: "http://127.0.0.1:8080",
  timeoutMs: 5000,
  useSimulationMode: true,
  simulatedNetworkLatencyMs: 400,
  simulatedUnregisteredRate: 0.15,
};

export const Route = createFileRoute("/$locale/sessions")({
  component: SessionsRoute,
});

function SessionsRoute() {
  const { sessions, isLoading } = useSessions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading sessions...
      </div>
    );
  }

  return (
    <SessionsDashboard
      sessions={sessions}
      config={DEFAULT_CONFIG}
      onResetSessionLimits={() => {}}
      onUpdateSessions={() => {}}
    />
  );
}
