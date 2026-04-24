/**
 * PURPOSE: React hook that exposes the cross-guild quest execution queue. Seeds from GET /api/quests/queue on mount, then re-fetches on execution-queue-updated and execution-queue-error WebSocket events.
 *
 * USAGE:
 * const { activeEntry, allEntries, errorEntry, isLoading } = useQuestQueueBinding();
 * // activeEntry = queue head (first entry) or null when queue empty
 * // errorEntry = head only if head has `error` set, else undefined
 */

import { useCallback, useEffect, useState } from 'react';

import { wsMessageContract } from '@dungeonmaster/shared/contracts';
import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { questQueueBroker } from '../../brokers/quest/queue/quest-queue-broker';

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

    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;
        if (
          parsed.data.type !== 'execution-queue-updated' &&
          parsed.data.type !== 'execution-queue-error'
        ) {
          return;
        }
        refresh().catch((error: unknown) => {
          globalThis.console.error('[use-quest-queue]', error);
        });
      },
    });

    return (): void => {
      connection.close();
    };
  }, [refresh]);

  const activeEntry = allEntries[0] ?? null;
  const errorEntry = activeEntry?.error ? activeEntry : undefined;

  return { activeEntry, allEntries, errorEntry, isLoading };
};
