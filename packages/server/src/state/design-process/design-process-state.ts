/**
 * PURPOSE: In-memory state tracking running Vite design sandbox processes by questId
 *
 * USAGE:
 * designProcessState.register({ questId, port, kill });
 * designProcessState.get({ questId });
 * // Returns { port, kill } or null
 */

import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

type DesignPort = NonNullable<Quest['designPort']>;

const processes = new Map<QuestId, { port: DesignPort; kill: () => void }>();

export const designProcessState = {
  register: ({
    questId,
    port,
    kill,
  }: {
    questId: QuestId;
    port: DesignPort;
    kill: () => void;
  }): void => {
    processes.set(questId, { port, kill });
  },

  get: ({ questId }: { questId: QuestId }): { port: DesignPort; kill: () => void } | null =>
    processes.get(questId) ?? null,

  remove: ({ questId }: { questId: QuestId }): boolean => processes.delete(questId),

  stopAll: (): void => {
    for (const entry of processes.values()) {
      entry.kill();
    }
    processes.clear();
  },

  clear: (): void => {
    processes.clear();
  },
} as const;
