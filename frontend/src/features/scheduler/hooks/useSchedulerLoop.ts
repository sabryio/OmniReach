/**
 * Scheduler Loop Hook
 * 
 * Orchestrates message sending every 5 seconds when scheduler is running.
 * Selects pending queue items, calls backend tick endpoint, applies results.
 */

import { useEffect, useRef } from 'react';
import { config } from '@/lib/config';
import { isWithinTimeWindow } from '@/lib/time-window';
import type { QueueItem, LogEntry } from '@/features/queue/schemas/queue.schema';
import type { SchedulerState } from '@/features/layout/schemas/layout.schema';
import type { Campaign } from '@/features/campaigns/schemas/campaign.schema';

export interface ProcessedItem {
  item_id: string;
  new_status: string;
  sent_at: number | null;
  error: string | null;
  response_payload: string | null;
}

export interface TickResponse {
  processed: ProcessedItem[];
  new_logs: LogEntry[];
}

export interface UseSchedulerLoopParams {
  schedulerState: SchedulerState;
  queue: QueueItem[];
  campaigns: Campaign[];
  onUpdateQueue: (updates: Array<{ id: string; updates: Partial<QueueItem> }>) => void;
  onAppendLogs: (logs: LogEntry[]) => void;
  onUpdateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
}

const TICK_INTERVAL_MS = 5000; // 5 seconds
const MAX_ITEMS_PER_TICK = 50; // Reasonable batch size

/**
 * Scheduler loop that runs every 5 seconds when enabled.
 * 
 * Process:
 * 1. Check if within time window
 * 2. Select pending items (up to MAX_ITEMS_PER_TICK)
 * 3. Call POST /api/scheduler/tick with item IDs
 * 4. Apply returned updates to queue state
 * 5. Append new logs
 * 6. Check for campaign completion
 */
export function useSchedulerLoop({
  schedulerState,
  queue,
  campaigns,
  onUpdateQueue,
  onAppendLogs,
  onUpdateCampaign,
}: UseSchedulerLoopParams) {
  // Use ref to access latest state in interval callback without re-creating interval
  const stateRef = useRef({ schedulerState, queue, campaigns });
  
  useEffect(() => {
    stateRef.current = { schedulerState, queue, campaigns };
  }, [schedulerState, queue, campaigns]);

  useEffect(() => {
    if (!schedulerState.isRunning) {
      return;
    }

    const executeTick = async () => {
      const { schedulerState: state, queue: currentQueue, campaigns: currentCampaigns } = stateRef.current;

      // 1. Check time window
      const withinWindow = isWithinTimeWindow(
        Date.now(),
        state.customWindowStartHour,
        state.customWindowEndHour,
        state.simulatedHourOffset
      );

      if (!withinWindow && state.strictTimeWindow) {
        // Outside time window — mark pending items as held_time_window
        const pendingItems = currentQueue.filter(q => q.status === 'pending');
        
        if (pendingItems.length > 0) {
          const updates = pendingItems.map(item => ({
            id: item.id,
            updates: {
              status: 'held_time_window' as const,
              timeWindowHoldUntil: new Date(Date.now() + 60000).toISOString(), // Check again in 1 minute
            }
          }));
          
          onUpdateQueue(updates);
        }
        
        return;
      }

      // 2. Select pending items
      const pendingItems = currentQueue
        .filter(q => q.status === 'pending')
        .slice(0, MAX_ITEMS_PER_TICK);

      if (pendingItems.length === 0) {
        return;
      }

      // 3. Call backend tick
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/scheduler/tick`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_ids: pendingItems.map(item => item.id),
          }),
        });

        if (!response.ok) {
          console.error(`Scheduler tick failed: ${response.statusText}`);
          return;
        }

        const result: TickResponse = await response.json();

        // 4. Apply queue updates
        const queueUpdates = result.processed.map(processed => ({
          id: processed.item_id,
          updates: {
            status: processed.new_status as QueueItem['status'],
            sentAt: processed.sent_at ? new Date(processed.sent_at).toISOString() : undefined,
            lastError: processed.error ?? undefined,
            responsePayload: processed.response_payload ?? undefined,
            attempts: currentQueue.find(q => q.id === processed.item_id)?.attempts ?? 0 + 1,
          }
        }));

        onUpdateQueue(queueUpdates);

        // 5. Append logs
        if (result.new_logs.length > 0) {
          onAppendLogs(result.new_logs);
        }

        // 6. Check campaign completion
        checkCampaignsCompletion(currentQueue, currentCampaigns, queueUpdates, onUpdateCampaign);

      } catch (error) {
        console.error('Scheduler tick error:', error);
      }
    };

    // Execute immediately on start, then every TICK_INTERVAL_MS
    executeTick();
    const interval = setInterval(executeTick, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [schedulerState.isRunning, onUpdateQueue, onAppendLogs, onUpdateCampaign]);
}

/**
 * Check if any running campaigns have completed (all items terminal).
 * Terminal statuses: sent, failed, skipped_unregistered, cancelled
 */
function checkCampaignsCompletion(
  queue: QueueItem[],
  campaigns: Campaign[],
  recentUpdates: Array<{ id: string; updates: Partial<QueueItem> }>,
  onUpdateCampaign: (campaignId: string, updates: Partial<Campaign>) => void
) {
  // Build map of current queue state (including recent updates)
  const queueMap = new Map(queue.map(item => [item.id, item]));
  
  for (const update of recentUpdates) {
    const existing = queueMap.get(update.id);
    if (existing) {
      queueMap.set(update.id, { ...existing, ...update.updates });
    }
  }

  const runningCampaigns = campaigns.filter(c => c.status === 'running');

  for (const campaign of runningCampaigns) {
    const campaignItems = Array.from(queueMap.values()).filter(
      item => item.campaignId === campaign.id
    );

    if (campaignItems.length === 0) {
      continue;
    }

    const terminalStatuses = ['sent', 'failed', 'skipped_unregistered', 'cancelled'];
    const allTerminal = campaignItems.every(item =>
      terminalStatuses.includes(item.status)
    );

    if (allTerminal) {
      onUpdateCampaign(campaign.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }
  }
}
