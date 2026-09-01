import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { CampaignQueryKeys } from "@/features/campaigns/api/queryKeys";
import { QueueQueryKeys } from "@/features/queue/api/queryKeys";
import { SessionQueryKeys } from "@/features/sessions/api/queryKeys";
import { DashboardQueryKeys } from "@/features/dashboard/api/queryKeys";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "dev-token";

interface SseConnectionState {
  isConnected: boolean;
  error: Error | null;
}

/**
 * SSE connection hook — connects to backend event stream and invalidates
 * TanStack Query caches on events.
 *
 * DIP: Components depend on TanStack Query hooks, not this SSE consumer directly.
 * OCP: New event types added by adding cases to onmessage, existing handlers unchanged.
 */
export function useSseConnection(): SseConnectionState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SseConnectionState>({
    isConnected: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let isActive = true;

    const connect = async () => {
      if (!isActive) return;

      // Create new abort controller for this connection
      abortControllerRef.current = new AbortController();

      try {
        await fetchEventSource(`${API_BASE_URL}/api/events`, {
          signal: abortControllerRef.current.signal,
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },

          async onopen(response) {
            if (response.ok) {
              setState({ isConnected: true, error: null });
              retryCountRef.current = 0; // Reset retry count on successful connection

              // Invalidate all query keys on connect to catch any missed events
              queryClient.invalidateQueries({
                queryKey: CampaignQueryKeys.all,
              });
              queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
              queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
              queryClient.invalidateQueries({
                queryKey: DashboardQueryKeys.all,
              });

              return;
            }

            // Server error
            throw new Error(
              `SSE connection failed: ${response.status} ${response.statusText}`,
            );
          },

          onmessage(event) {
            if (!event.data) return;

            try {
              const data = JSON.parse(event.data);

              // Route events to appropriate cache invalidation
              switch (event.event) {
                case "campaign.created":
                case "campaign.status":
                  queryClient.invalidateQueries({
                    queryKey: CampaignQueryKeys.all,
                  });
                  queryClient.invalidateQueries({
                    queryKey: DashboardQueryKeys.all,
                  });
                  break;

                case "queue.item_updated":
                  queryClient.invalidateQueries({
                    queryKey: QueueQueryKeys.all,
                  });
                  queryClient.invalidateQueries({
                    queryKey: DashboardQueryKeys.all,
                  });
                  break;

                case "queue.stats":
                  queryClient.invalidateQueries({
                    queryKey: QueueQueryKeys.all,
                  });
                  queryClient.invalidateQueries({
                    queryKey: DashboardQueryKeys.all,
                  });
                  break;

                case "session.status":
                  queryClient.invalidateQueries({
                    queryKey: SessionQueryKeys.all,
                  });
                  break;

                case "log.entry":
                  // Logs are append-only, could use optimistic update here
                  // For now, just invalidate to refetch
                  queryClient.invalidateQueries({ queryKey: ["logs"] });
                  break;

                case "contact.verify_progress":
                  window.dispatchEvent(
                    new CustomEvent("contact.verify_progress", {
                      detail: data,
                    }),
                  );
                  break;

                case "contact.verify_complete":
                  window.dispatchEvent(
                    new CustomEvent("contact.verify_complete", {
                      detail: data,
                    }),
                  );
                  break;

                default:
                  console.warn("Unknown SSE event type:", event.event, data);
              }
            } catch (err) {
              console.error("Failed to parse SSE event:", err, event);
            }
          },

          onerror(err) {
            setState({ isConnected: false, error: err as Error });

            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            const delay = Math.min(
              1000 * Math.pow(2, retryCountRef.current),
              30000,
            );
            retryCountRef.current += 1;

            console.error(
              "SSE connection error, retrying in",
              delay,
              "ms:",
              err,
            );

            // fetchEventSource handles retries automatically, but we'll track state
            throw err; // Let fetchEventSource handle the retry
          },

          onclose() {
            setState({ isConnected: false, error: null });
            console.log("SSE connection closed");
          },
        });
      } catch (err) {
        // Connection failed or was aborted
        if (isActive && err instanceof Error && err.name !== "AbortError") {
          setState({ isConnected: false, error: err });

          // Manual retry with exponential backoff
          const delay = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            30000,
          );
          retryCountRef.current += 1;

          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isActive) {
              connect();
            }
          }, delay);
        }
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      isActive = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [queryClient]);

  return state;
}
