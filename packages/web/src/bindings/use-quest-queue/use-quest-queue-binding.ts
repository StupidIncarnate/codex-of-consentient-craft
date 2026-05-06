/**
 * PURPOSE: React hook that exposes the cross-guild quest execution queue. Seeds from GET /api/quests/queue on mount, then re-fetches on every emission of the shared web socket channel's executionQueueChanged$ observable (covers both execution-queue-updated and execution-queue-error wire events).
 *
 * USAGE:
 * const { activeEntry, allEntries, errorEntry, isLoading } = useQuestQueueBinding();
 * // activeEntry = queue head (first entry) or null when queue empty
 * // errorEntry = head only if head has `error` set, else undefined
 */

import { useCallback, useEffect, useState } from 'react';

import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { questQueueBroker } from '../../brokers/quest/queue/quest-queue-broker';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';

export const useQuestQueueBinding = (): {
  activeEntry: QuestQueueEntry | null;
  allEntries: readonly QuestQueueEntry[];
  errorEntry: QuestQueueEntry | undefined;
  isLoading: boolean;
} => {
  const [allEntries, setAllEntries] = useState<readonly QuestQueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const entries = await questQueueBroker();
      setAllEntries(entries);
    } catch (error: unknown) {
      globalThis.console.error('[use-quest-queue]', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      globalThis.console.error('[use-quest-queue]', error);
    });

    const subscription = webSocketChannelState.executionQueueChanged$().subscribe(() => {
      refresh().catch((error: unknown) => {
        globalThis.console.error('[use-quest-queue]', error);
      });
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  const activeEntry = allEntries[0] ?? null;
  const errorEntry = activeEntry?.error ? activeEntry : undefined;

  return { activeEntry, allEntries, errorEntry, isLoading };
};
