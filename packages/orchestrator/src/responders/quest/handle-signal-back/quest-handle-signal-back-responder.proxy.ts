/**
 * PURPOSE: Proxy for QuestHandleSignalBackResponder — runs the responder's real broker chain
 * (questGetBroker, questOperationsUpdateBroker, questAdvanceBroker) with only the fs adapters
 * mocked, and captures every persisted quest.json write. The unmarked-unit gate
 * (`signalGateTransformer`) runs REAL and unmocked — it is a pure function over the quest object
 * the fs proxies already hand it, so a test drives it by shaping `workItem.assignedUnitIds` /
 * `observations` on the fixture, not through this proxy.
 *
 * USAGE:
 * const proxy = QuestHandleSignalBackResponderProxy();
 * proxy.setupSignalFlow({ quest, questAfterOutcome });
 * await proxy.callResponder({ questId, workItemId, signal: 'complete' });
 * const outcome = proxy.getAllPersistedQuests();
 *
 * The mocked filesystem is a FIFO read queue, not a store — a later load does NOT see an earlier
 * persist. Each setup method queues one read cycle per broker invocation the responder makes; the
 * broker that re-reads AFTER the outcome persist (advance's own operations-update) is fed
 * `questAfterOutcome` — the quest as the outcome persist wrote it.
 *
 * Date.prototype.toISOString is pinned to '2024-01-15T10:00:00.000Z' so completedAt / createdAt /
 * updatedAt stamps are deterministic. crypto.randomUUID passes through by default; advance's own
 * work-item id is queued via setupAdvanceUuids (its own proxy owns that spy).
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type { questContract } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questAdvanceBrokerProxy } from '../../../brokers/quest/advance/quest-advance-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../../brokers/quest/operations-update/quest-operations-update-broker.proxy';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

export const QuestHandleSignalBackResponderProxy = (): {
  callResponder: typeof QuestHandleSignalBackResponder;
  setupQuestUnreadable: () => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupSignalFlow: (params: { quest: Quest; questAfterOutcome: Quest }) => void;
  setupAdvanceUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Parsed[];
} => {
  const getProxy = questGetBrokerProxy();
  const operationsUpdateProxy = questOperationsUpdateBrokerProxy();
  const advanceProxy = questAdvanceBrokerProxy();

  // Pins completedAt (responder callback) and createdAt/updatedAt (both persists).
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    callResponder: QuestHandleSignalBackResponder,

    // questGetBroker resolves { success: false } — corrupt quest.json or unresolvable path. The
    // responder must throw (a silent success would drop the agent's signal).
    setupQuestUnreadable: (): void => {
      getProxy.setupEmptyFolder();
    },

    // Quest loads but the responder never persists (work item missing or already terminal) — only
    // the responder's own questGetBroker read cycle is queued.
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    // Full flow: responder get + the atomic outcome persist (reads `quest`) + the advance that
    // follows (reads `questAfterOutcome`, persisting only when a pending op remains).
    setupSignalFlow: ({
      quest,
      questAfterOutcome,
    }: {
      quest: Quest;
      questAfterOutcome: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest });
      operationsUpdateProxy.setupQuestFound({ quest });
      advanceProxy.setupQuestFound({ quest: questAfterOutcome });
    },

    setupAdvanceUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      advanceProxy.setupUuids({ ids });
    },

    // Every quest.json write across the whole flow.
    getAllPersistedContents: (): readonly unknown[] =>
      operationsUpdateProxy.getAllPersistedContents(),

    getAllPersistedQuests: (): readonly Parsed[] => operationsUpdateProxy.getAllPersistedQuests(),
  };
};
