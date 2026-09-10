/**
 * PURPOSE: Proxy for questSessionRecordBroker — delegates wholesale to the operations-update proxy,
 * so the append runs through the real per-quest lock, the real load and the real contract parse with
 * only the fs adapters mocked. That is what lets a test prove the append is idempotent by counting
 * PERSISTS rather than by inspecting the broker's own control flow.
 *
 * USAGE:
 * const proxy = questSessionRecordBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * // ...call questSessionRecordBroker...
 * proxy.getAllPersistedQuests();
 *
 * `Date.prototype.toISOString` is pinned by the child proxy, so the row's `startedAt` is
 * deterministic without this proxy staging a clock of its own.
 */

import type { questContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const questSessionRecordBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  getAllPersistedQuests: () => readonly Parsed[];
  getLastPersistedQuest: () => Parsed;
} => {
  const updateProxy = questOperationsUpdateBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      updateProxy.setupQuestFound({ quest });
    },

    getAllPersistedQuests: (): readonly Parsed[] => updateProxy.getAllPersistedQuests(),

    getLastPersistedQuest: (): Parsed => updateProxy.getLastPersistedQuest(),
  };
};
