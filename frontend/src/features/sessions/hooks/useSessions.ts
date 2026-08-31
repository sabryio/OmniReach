import { useState, useCallback, useMemo } from "react";
import type { WABridgeConfig } from "@/features/layout/schemas/layout.schema";
import type { Session } from "../schemas/session.schema";
import { getSessionQuota, formatDuration } from "../utils/quota";

/**
 * Comprehensive hook for SessionsDashboard component
 * Manages session quotas, verification testing, live updates
 */
export function useSessionDashboard(
  sessions: Session[],
  _config: WABridgeConfig,
  onResetSessionLimits: (id: string) => void,
  onUpdateSessions: (sessions: Session[]) => void,
) {
  const [testPhone, setTestPhone] = useState<string>("+966 50 123 4567");
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Calculate quotas for all sessions
  const sessionQuotas = useMemo(() => {
    return sessions.map((session) => ({
      session,
      quota: getSessionQuota(session, currentTime),
    }));
  }, [sessions, currentTime]);

  // Test verification
  const handleTestVerification = useCallback(
    async (sessionId: string) => {
      if (!testPhone.trim()) return;
      setTestSessionId(sessionId);
      setTestResult("Checking...");

      try {
        // TODO: Implement actual WABridge verification
        // Simulate verification for now
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const isRegistered = !testPhone.endsWith("4"); // mock logic
        setTestResult(
          isRegistered
            ? `✓ Registered — ${testPhone}@c.us`
            : "✗ Not registered on WhatsApp",
        );
      } catch (e) {
        setTestResult("Error: " + String(e));
      }
    },
    [testPhone],
  );

  // Reset session limits
  const handleResetLimits = useCallback(
    (sessionId: string) => {
      onResetSessionLimits(sessionId);
      setTestResult(null);
    },
    [onResetSessionLimits],
  );

  // Update single session
  const updateSession = useCallback(
    (updated: Session) => {
      onUpdateSessions(
        sessions.map((s) => (s.id === updated.id ? updated : s)),
      );
    },
    [sessions, onUpdateSessions],
  );

  return {
    // Test verification
    testPhone,
    setTestPhone,
    testSessionId,
    testResult,
    setTestResult,
    handleTestVerification,

    // Session management
    sessionQuotas,
    handleResetLimits,
    updateSession,

    // Live updates
    currentTime,
    setCurrentTime,

    // Helpers
    formatDuration,
    getSessionQuota,
  };
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSessionDashboard instead
 */
export function useSessions(
  sessions: Session[],
  _config: WABridgeConfig,
  onResetLimits: (id: string) => void,
  onUpdateSessions: (sessions: Session[]) => void,
) {
  const [testPhone, setTestPhone] = useState("");
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const resetLimits = useCallback(
    (id: string) => onResetLimits(id),
    [onResetLimits],
  );

  const updateSession = useCallback(
    (updated: Session) => {
      onUpdateSessions(
        sessions.map((s) => (s.id === updated.id ? updated : s)),
      );
    },
    [sessions, onUpdateSessions],
  );

  const testVerify = useCallback(
    async (sessionId: string) => {
      if (!testPhone.trim()) return;
      setTestResults((p) => ({ ...p, [sessionId]: "checking…" }));
      // Placeholder: simulate API call
      await new Promise((r) => setTimeout(r, 800));
      const isRegistered = !testPhone.endsWith("4"); // mock logic
      setTestResults((p) => ({
        ...p,
        [sessionId]: isRegistered
          ? `✓ Registered — ${testPhone}@c.us`
          : "✗ Not registered on WhatsApp",
      }));
    },
    [testPhone],
  );

  return {
    testPhone,
    setTestPhone,
    testResults,
    resetLimits,
    updateSession,
    testVerify,
  };
}
