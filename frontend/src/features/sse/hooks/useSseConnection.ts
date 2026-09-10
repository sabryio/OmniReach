import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/rpc";

interface SseConnectionState {
  isConnected: boolean;
  error: Error | null;
}

/**
 * SSE connection hook — connects to backend event stream using rorpc's live query
 * and invalidates TanStack Query caches on events.
 *
 * Uses orpc.events.events.liveOptions() which handles:
 * - Automatic reconnection with exponential backoff
 * - Auth headers via rorpc client config
 * - AbortController cleanup
 * - Event stream parsing
 *
 * DIP: Components depend on TanStack Query hooks, not this SSE consumer directly.
 * OCP: New event types added by adding cases to useEffect, existing handlers unchanged.
 */
export function useSseConnection(): SseConnectionState {
  const queryClient = useQueryClient();

  // Use rorpc's live query for SSE connection
  // liveOptions() returns a useQuery config that:
  // - Opens an EventSource/fetch-event-source connection
  // - Yields events as they arrive
  // - Handles reconnection automatically
  const {
    data: latestEvent,
    isLoading,
    error,
  } = useQuery(
    orpc.events.events.liveOptions({
      // Don't retry failed connections too aggressively
      retry: (failureCount) => failureCount < 3,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      // Keep connection alive
      staleTime: Infinity,
      gcTime: Infinity,
    }),
  );

  console.log({ latestEvent });

  // Handle individual events as they arrive
  useEffect(() => {
    if (!latestEvent) return;

    const { type, data } = latestEvent;

    try {
      // Route events to appropriate cache invalidation
      switch (type) {
        case "campaign_created":
        case "campaign_status":
          queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
          break;

        case "queue_item_updated":
        case "queue_item_added":
        case "queue_stats":
          queryClient.invalidateQueries(
            orpc.queue.list.queryOptions({ input: { campaign_id: null } }),
          );
          queryClient.invalidateQueries(orpc.queue.stats.queryOptions());
          break;

        case "session_status":
          queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
          break;

        case "log_entry":
          queryClient.invalidateQueries(orpc.logs.list.queryOptions());
          break;

        case "contact_verify_progress":
          // Dispatch custom events for verification UI
          window.dispatchEvent(
            new CustomEvent("contact.verify_progress", { detail: data }),
          );
          break;

        case "contact_verify_complete":
          window.dispatchEvent(
            new CustomEvent("contact_verify_complete", { detail: data }),
          );
          break;

        default:
          console.warn("Unknown SSE event type:", type, data);
      }
    } catch (err) {
      console.error("Failed to handle SSE event:", err, latestEvent);
    }
  }, [latestEvent, queryClient]);

  // Return connection state
  return {
    isConnected: !isLoading && !error,
    error: error ? new Error(String(error)) : null,
  };
}
