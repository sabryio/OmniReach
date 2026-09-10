import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/rpc";

/**
 * Hook for batch contact verification via WABridge
 * Returns immediately with a job_id. Progress/results stream via SSE:
 *   - event: contact_verify_progress
 *   - event: contact_verify_complete
 */
export function useVerifyBatchContacts() {
  const mutation = useMutation(
    orpc.contacts.verifyBatch.mutationOptions({
      onSuccess: (data) => {
        console.log("✅ Verification batch started, job_id:", data.job_id);
      },
      onError: (error) => {
        console.error("❌ Failed to start verification batch:", error);
      },
    }),
  );

  return {
    verifyBatch: mutation.mutate,
    verifyBatchAsync: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    jobId: mutation.data?.job_id,
    error: mutation.error,
    reset: mutation.reset,
  };
}
