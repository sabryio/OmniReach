import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SessionsDashboard, AddSessionModal } from "@/features/sessions";
import { useSessions } from "@/features/sessions/hooks/useSessionsQuery";
import {
  useSyncSession,
  useResetSessionLimits,
  useSendTestMessage,
} from "@/features/sessions/hooks/useSessionMutations";
import type { WABridgeConfig } from "@/features/layout/schemas/layout.schema";

const DEFAULT_CONFIG: WABridgeConfig = {
  baseUrl: "http://127.0.0.1:7171",
  timeoutMs: 5000,
  useSimulationMode: true,
  simulatedNetworkLatencyMs: 400,
  simulatedUnregisteredRate: 0.15,
};

export const Route = createFileRoute("/$locale/sessions")({
  component: SessionsRoute,
});

function SessionsRoute() {
  const { sessions, isLoading, error } = useSessions();
  const { syncSession } = useSyncSession();
  const { resetLimits } = useResetSessionLimits();
  const { sendTestMessageAsync } = useSendTestMessage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);

  const handleVerifyNumber = async (
    _sessionId: string,
    phone: string,
  ): Promise<{
    isRegistered: boolean;
    waId?: string;
    error?: string;
  }> => {
    // TODO: Call actual verification API endpoint
    // POST /api/contacts/verify with { sessionId, phone }
    // For now, simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate: numbers ending in '4' are unregistered
    const isRegistered = !phone.endsWith("4");

    return {
      isRegistered,
      waId: isRegistered
        ? `${phone.replace(/\D/g, "")}@s.whatsapp.net`
        : undefined,
    };
  };

  const handleSendTest = async (
    sessionId: string,
    phone: string,
    message: string,
  ): Promise<void> => {
    await sendTestMessageAsync({ sessionId, phone, message });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading sessions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive text-sm">
        Error loading sessions: {String(error)}
      </div>
    );
  }

  return (
    <>
      <SessionsDashboard
        sessions={sessions}
        config={DEFAULT_CONFIG}
        onResetSessionLimits={(id) => resetLimits(id)}
        onUpdateSessions={() => {}}
        onAddSession={() => setIsAddModalOpen(true)}
        onSyncSession={(id) => syncSession(id)}
        onVerifyNumber={handleVerifyNumber}
        onSendTest={handleSendTest}
        onEditSession={(id) => setEditSessionId(id)}
      />
      <AddSessionModal
        isOpen={isAddModalOpen || !!editSessionId}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditSessionId(null);
        }}
        sessionId={editSessionId}
      />
    </>
  );
}
