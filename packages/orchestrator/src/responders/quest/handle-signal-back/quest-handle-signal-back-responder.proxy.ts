/**
 * PURPOSE: Proxy for QuestHandleSignalBackResponder — runs the responder's real broker chain
 * (questGetBroker, questOperationsUpdateBroker, questAdvanceBroker, questBlockOnFailureBroker)
 * with only the fs adapters mocked, and captures every persisted quest.json write.
 * `questGetBlightChecklistBroker` is mocked at the module level (mirroring
 * `guildGetBrokerProxy`'s pattern) rather than composed via its own fs-simulation proxy: it drives
 * an independent find-quest-path + load + guild + cwd + git-diff chain whose reads land on the
 * SAME shared file-path addresses as `getProxy`/`operationsUpdateProxy`/`advanceProxy` (same
 * default guildId, same quest.folder) — composing it inline would require staging order to exactly
 * mirror real execution order across every nested proxy including questOperationsUpdateBroker's own
 * persist-path joins, which is far too fragile for what this responder's tests actually need to
 * verify (what the responder DOES with whatever the checklist broker returns, not how that broker
 * resolves its own path). questGetBlightChecklistBroker's own fs resolution is already exhaustively
 * covered by quest-get-blight-checklist-broker.test.ts.
 *
 * USAGE:
 * const proxy = QuestHandleSignalBackResponderProxy();
 * proxy.setupSignalFlow({ quest, questAfterOutcome });
 * await proxy.callResponder({ questId, workItemId, signal: 'complete', operationStatus: 'done' });
 * const outcome = proxy.getPersistedQuestAt({ index: 0 });
 *
 * The mocked filesystem is a FIFO read queue, not a store — a later load does NOT see an earlier
 * persist. Each setup method queues one read cycle per broker invocation the responder makes; the
 * brokers that re-read AFTER the outcome persist (advance's operations-update, the block broker's
 * get + modify) are fed `questAfterOutcome` — the quest as the outcome persist wrote it.
 *
 * Date.prototype.toISOString is pinned to '2024-01-15T10:00:00.000Z' so completedAt / createdAt /
 * updatedAt stamps are deterministic. crypto.randomUUID passes through by default; the ids the
 * RESPONDER mints are queued via setupResponderUuids in the order it mints them — the blightscout
 * operation, then its work item, then the pt continuation — and advance's work-item id via
 * setupAdvanceUuids (advance's own proxy owns that spy — its stack frame matches first).
 */

import type { BlightChecklistStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import {
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { questAdvanceBrokerProxy } from '../../../brokers/quest/advance/quest-advance-broker.proxy';
import { questBlockOnFailureBrokerProxy } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker.proxy';
import { questGetBlightChecklistBroker } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker';
import { questGetBlightChecklistBrokerProxy } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../../brokers/quest/operations-update/quest-operations-update-broker.proxy';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';

registerModuleMock({
  module: '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker',
});

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;
type Checklist = ReturnType<typeof BlightChecklistStub>;

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

export const QuestHandleSignalBackResponderProxy = (): {
  callResponder: typeof QuestHandleSignalBackResponder;
  setupQuestUnreadable: () => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupSignalFlow: (params: { quest: Quest; questAfterOutcome: Quest }) => void;
  setupSignalBlocked: (params: { quest: Quest; questAfterOutcome: Quest }) => void;
  setupQuestWithBlightChecklist: (params: { quest: Quest; checklist: Checklist | null }) => void;
  setupSignalFlowWithBlightChecklist: (params: {
    quest: Quest;
    questAfterOutcome: Quest;
    checklist: Checklist | null;
  }) => void;
  getBlightChecklistCallArgs: () => readonly unknown[];
  setupResponderUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupAdvanceUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Parsed[];
  getPersistedQuestAt: (params: { index: number }) => Parsed;
  getLastPersistedQuest: () => Parsed;
} => {
  const getProxy = questGetBrokerProxy();
  const operationsUpdateProxy = questOperationsUpdateBrokerProxy();
  const advanceProxy = questAdvanceBrokerProxy();
  // Stubbed ({ blocked: true }) by default; setupSignalBlocked swaps in the real broker so a test
  // can assert the actual blocked + skipped persisted outcome.
  const blockProxy = questBlockOnFailureBrokerProxy();

  // Wired to satisfy enforce-proxy-child-creation (the implementation imports
  // questGetBlightChecklistBroker) — never staged. The module mock below is the real staging
  // mechanism; see the docblock for why composing this proxy's own fs-simulation is unsafe here.
  questGetBlightChecklistBrokerProxy();

  // Default: passthrough to the real broker, matching guildGetBrokerProxy's pattern — an
  // unstaged call still runs genuine logic (and, with no fs mocked for it here, surfaces loudly
  // as a thrown error) rather than silently resolving to undefined.
  const mockedChecklist = questGetBlightChecklistBroker as jest.MockedFunction<
    typeof questGetBlightChecklistBroker
  >;
  const realChecklistMod = requireActual<{
    questGetBlightChecklistBroker: typeof questGetBlightChecklistBroker;
  }>({
    module: '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker',
  });
  mockedChecklist.mockImplementation(realChecklistMod.questGetBlightChecklistBroker);

  // The blightscout operation id, its work-item id, and the pt-continuation operation id are all
  // minted in the responder's own update callback, so the dispatch stack matches this proxy's handle
  // (advance's id is minted in quest-advance-broker frames and routes to the advance proxy's spy
  // instead). Passthrough keeps unasserted ids real.
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  // Pins completedAt (responder callback), createdAt (advance callback), and updatedAt (both
  // persists AND the block path's questModifyBroker persist, which the operations-update proxy's
  // own pin does not reach — its handle only matches operations-update frames).
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

    // Full non-blocking flow: responder get + the atomic outcome persist (reads `quest`) + the
    // advance that follows (reads `questAfterOutcome`, persisting only when a pending op remains).
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

    // Spent locked pt-chain flow: responder get + outcome persist, then the REAL block broker
    // (its own get + modify both read `questAfterOutcome`). Advance never runs on this path.
    setupSignalBlocked: ({
      quest,
      questAfterOutcome,
    }: {
      quest: Quest;
      questAfterOutcome: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest });
      operationsUpdateProxy.setupQuestFound({ quest });
      blockProxy.setupPassthrough();
      blockProxy.setupQuestFound({ quest: questAfterOutcome });
    },

    // Throw-path blightscout gate tests: only the responder's own get read is staged — no
    // mutation is ever expected. `checklist: null` covers the unpinned-baseRef case.
    setupQuestWithBlightChecklist: ({
      quest,
      checklist,
    }: {
      quest: Quest;
      checklist: Checklist | null;
    }): void => {
      getProxy.setupQuestFound({ quest });
      mockedChecklist.mockResolvedValueOnce(checklist);
    },

    // Full non-blocking flow with the gate's blightscout branch wired: get + the outcome persist
    // (reads `quest`) + advance (reads `questAfterOutcome`) — same as setupSignalFlow, plus the
    // checklist broker's mocked return value. `checklist: null` covers the unpinned-baseRef case.
    setupSignalFlowWithBlightChecklist: ({
      quest,
      questAfterOutcome,
      checklist,
    }: {
      quest: Quest;
      questAfterOutcome: Quest;
      checklist: Checklist | null;
    }): void => {
      getProxy.setupQuestFound({ quest });
      operationsUpdateProxy.setupQuestFound({ quest });
      advanceProxy.setupQuestFound({ quest: questAfterOutcome });
      mockedChecklist.mockResolvedValueOnce(checklist);
    },

    // Proves the gate is role-gated: a non-blightscout signal must never invoke the checklist
    // broker at all (that's what stops a git diff running on every siegemaster/codeweaver signal).
    // Raw call args, not a count — the test derives .length itself (ban-primitives forbids a raw
    // number return type here).
    getBlightChecklistCallArgs: (): readonly unknown[] => mockedChecklist.mock.calls,

    setupResponderUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },

    setupAdvanceUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      advanceProxy.setupUuids({ ids });
    },

    // Every quest.json write across the whole flow — the write-file mock entry is shared, so the
    // block path's questModifyBroker persist lands here alongside the operations-update persists.
    getAllPersistedContents: (): readonly unknown[] =>
      operationsUpdateProxy.getAllPersistedContents(),

    getAllPersistedQuests: (): readonly Parsed[] => operationsUpdateProxy.getAllPersistedQuests(),

    getPersistedQuestAt: ({ index }: { index: number }): Parsed => {
      const writes = operationsUpdateProxy.getAllPersistedContents();
      return questContract.parse(JSON.parse(String(writes[index])));
    },

    getLastPersistedQuest: (): Parsed => {
      const writes = operationsUpdateProxy.getAllPersistedContents();
      return questContract.parse(JSON.parse(String(writes[writes.length - 1])));
    },
  };
};
