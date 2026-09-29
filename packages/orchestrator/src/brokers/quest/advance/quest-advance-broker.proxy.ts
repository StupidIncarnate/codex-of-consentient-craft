/**
 * PURPOSE: Proxy for questAdvanceBroker — delegates quest file I/O to the
 * questOperationsUpdateBroker proxy (the broker's only dependency) and pins
 * randomUUID with a queue of fixed ids so the created work item is deterministic.
 *
 * USAGE:
 * const proxy = questAdvanceBrokerProxy();
 * proxy.setupUuids({ ids: ['99999999-9999-4999-8999-999999999999'] });
 * proxy.setupQuestFound({ quest });
 * // ...call questAdvanceBroker...
 * const persisted = proxy.getLastPersistedQuest();
 */

import { randomUUID } from '#gateway/node/crypto';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import type { questContract } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const questAdvanceBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Parsed;
} => {
  const operationsUpdateProxy = questOperationsUpdateBrokerProxy();
  // The new work item id comes from randomUUID. Passthrough by default; tests queue
  // deterministic ids via setupUuids.
  const uuidSpy = registerMock({ fn: randomUUID });
  const realCrypto = requireActual<{ randomUUID: typeof randomUUID }>({
    module: '#gateway/node/crypto',
  });
  uuidSpy.calledWith([]).implement(() => realCrypto.randomUUID());

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      operationsUpdateProxy.setupQuestFound({ quest });
    },

    setupUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },

    getAllPersistedContents: (): readonly unknown[] =>
      operationsUpdateProxy.getAllPersistedContents(),

    getLastPersistedQuest: (): Parsed => operationsUpdateProxy.getLastPersistedQuest(),
  };
};
