import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SessionsDashboard, AddSessionModal } from "@/features/sessions";
import { useSessions } from "@/features/sessions/hooks/useSessionsQuery";
import {
  useSyncSession,
  useResetSessionLimits,
  useSendTestMessage,
  useDeleteSession,
} from "@/features/sessions/hooks/useSessionMutations";
import { verifyBatch } from "@/features/customers/api/contacts.api";
import type { VerifyCompletePayload } from "@/features/customers/api/contacts.api";
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
  const { deleteSession } = useDeleteSession();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);

  const handleVerifyNumber = async (
    sessionId: string,
    phone: string,
  ): Promise<{
    isRegistered: boolean;
    waId?: string;
    error?: string;
  }> => {
    const { jobId } = await verifyBatch({ sessionId, phones: [phone] });

    return new Promise((resolve) => {
      const onComplete = (e: Event) => {
        const payload = (e as CustomEvent<VerifyCompletePayload>).detail;
        if (payload.job_id !== jobId) return;
        window.removeEventListener("contact.verify_complete", onComplete);
        const result = payload.results[0];
        if (!result) {
          resolve({ isRegistered: false, error: "No result returned" });
          return;
        }
        resolve({
          isRegistered: result.is_registered,
          waId: result.wa_id ?? undefined,
          error: result.error ?? undefined,
        });
      };
      window.addEventListener("contact.verify_complete", onComplete);
    });
  };

  const handleSendTest = async (
    sessionId: string,
    phone: string,
    message: string,
  ): Promise<void> => {
    await sendTestMessageAsync({ sessionId, phone, message });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId, {
      onSuccess: () => {
        toast.success("Session deleted successfully");
      },
      onError: (error) => {
        toast.error("Failed to delete session", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });
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
        onDeleteSession={handleDeleteSession}
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
