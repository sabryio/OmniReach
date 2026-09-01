/**
 * useVerificationJob — manages a background batch contact verification job.
 *
 * Flow:
 *   1. Call startJob(sessionId, phones) → fires POST /api/contacts/verify-batch
 *   2. Backend returns job_id immediately (202 Accepted)
 *   3. useSseConnection dispatches DOM CustomEvents for SSE frames:
 *        "contact.verify_progress" → updates progress state
 *        "contact.verify_complete" → sets results, marks job done
 *   4. Caller reads { isRunning, progress, results } to drive UI
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { verifyBatch } from "@/features/customers/api/contacts.api";
import type {
  VerifyProgressPayload,
  VerifyCompletePayload,
  VerifyResultItem,
} from "@/features/customers/api/contacts.api";

export type VerificationProgress = {
  checked: number;
  total: number;
  registered: number;
  unregistered: number;
};

export type VerificationJobState = {
  jobId: string | null;
  isRunning: boolean;
  progress: VerificationProgress | null;
  results: VerifyResultItem[] | null;
  error: string | null;
};

export function useVerificationJob() {
  const [state, setState] = useState<VerificationJobState>({
    jobId: null,
    isRunning: false,
    progress: null,
    results: null,
    error: null,
  });

  // Track current jobId in a ref for use inside event handlers
  const jobIdRef = useRef<string | null>(null);

  useEffect(() => {
    const onProgress = (e: Event) => {
      const payload = (e as CustomEvent<VerifyProgressPayload>).detail;
      // Only handle events for the current job
      if (payload.job_id !== jobIdRef.current) return;

      setState((prev) => ({
        ...prev,
        progress: {
          checked: payload.checked,
          total: payload.total,
          registered: payload.registered,
          unregistered: payload.unregistered,
        },
      }));
    };

    const onComplete = (e: Event) => {
      const payload = (e as CustomEvent<VerifyCompletePayload>).detail;
      if (payload.job_id !== jobIdRef.current) return;

      setState((prev) => ({
        ...prev,
        isRunning: false,
        results: payload.results,
      }));
      jobIdRef.current = null;
    };

    window.addEventListener("contact.verify_progress", onProgress);
    window.addEventListener("contact.verify_complete", onComplete);

    return () => {
      window.removeEventListener("contact.verify_progress", onProgress);
      window.removeEventListener("contact.verify_complete", onComplete);
    };
  }, []);

  const startJob = useCallback(
    async (sessionId: string, phones: string[]) => {
      setState({
        jobId: null,
        isRunning: true,
        progress: { checked: 0, total: phones.length, registered: 0, unregistered: 0 },
        results: null,
        error: null,
      });

      try {
        const { jobId } = await verifyBatch({ sessionId, phones });
        jobIdRef.current = jobId;
        setState((prev) => ({ ...prev, jobId }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start verification";
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: message,
        }));
      }
    },
    [],
  );

  const reset = useCallback(() => {
    jobIdRef.current = null;
    setState({
      jobId: null,
      isRunning: false,
      progress: null,
      results: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    startJob,
    reset,
  };
}
