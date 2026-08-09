/**
 * PURPOSE: Proxy for OrchestrationMergeResponder — composes the child broker/state proxies so the
 * responder AND the brokers it drives (questGetBroker, questModifyBroker,
 * questOperationsUpdateBroker) run REAL with only the fs adapters mocked. Follows the same
 * composition shape as orchestration-start-responder.proxy.ts: crypto.randomUUID is queued with
 * fixed ids so the appended operation/work-item ids are deterministic, and
 * Date.prototype.toISOString is pinned by the composed persist proxies so `now` and every
 * broker-stamped timestamp agree.
 *
 * USAGE:
 * const proxy = OrchestrationMergeResponderProxy();
 * proxy.setupMerge({ quest });
 * const result = await proxy.callResponder({ questId: quest.id });
 * proxy.getLastPersistedQuest(); // the ledger-append's atomic persist
 */

import { ProcessIdStub, QuestIdStub, questContract } from '@dungeonmaster/shared/contracts';
import type { QuestWorkItemId, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../../brokers/quest/operations-update/quest-operations-update-broker.proxy';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationMergeResponder } from './orchestration-merge-responder';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

// The responder consumes exactly two uuids per call, in this order: the warpgate operation item's
// id, then the warpgate work item's id. Fixed so every persisted-shape assertion is deterministic.
const WARPGATE_OPERATION_ID = 'eeeeeeee-1111-4222-9333-444444444444';
const WARPGATE_WORK_ITEM_ID = 'ffffffff-1111-4222-9333-444444444444';

export const OrchestrationMergeResponderProxy = (): {
  callResponder: typeof OrchestrationMergeResponder;
  setupQuestNotFound: () => void;
  setupMerge: (params: { quest: Quest }) => void;
  setupModifyFailure: (params: { quest: Quest }) => void;
  setupTavernkeeperProcessRunning: (params: { workItemId: QuestWorkItemId }) => void;
  wasFollowupProcessKilled: () => boolean;
  wasKilledBeforeAnyQuestWrite: () => boolean;
  getAllPersistedQuests: () => readonly Parsed[];
  getLastPersistedQuest: () => Parsed;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  // Runs REAL — its atomic read-modify-write is fed by the read staged in setupMerge, and its
  // captured quest.json writes back every getPersisted* inspector below. The write mock is shared
  // with questModifyBroker's persist (same underlying fs adapter), so the status-flip transition's
  // write lands in the same ordered list this proxy reads from.
  const opsProxy = questOperationsUpdateBrokerProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  uuidSpy.onceFor([]).returns(WARPGATE_OPERATION_ID);
  uuidSpy.onceFor([]).returns(WARPGATE_WORK_ITEM_ID);

  // A single mutable box (held by a const binding) tracks what the registered process's kill
  // callback observed at the moment it fired — whether it was called at all, and whether any
  // quest.json write had already landed by then.
  const killTracking = { called: false, noQuestWriteYet: false };

  return {
    callResponder: OrchestrationMergeResponder,

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    // Stages three sequential reads at the same questFilePath, matching the responder's own three
    // broker calls in order: questGetBroker's initial load, questModifyBroker's own load (still
    // pre-flip — the status flip is what THAT call writes), then questOperationsUpdateBroker's
    // load. In production the operations-update broker's read hits real disk after the modify
    // broker's real write has already landed, so it observes `merging`; this mocked read is static
    // per stage, so the merging status is staged explicitly for the third read to reproduce the
    // same sequencing a real filesystem provides for free (see the responder's own ordering
    // comment on why this matters for status derivation).
    setupMerge: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      opsProxy.setupQuestFound({ quest: questContract.parse({ ...quest, status: 'merging' }) });
    },

    // The status-flip persist never lands (questModifyBroker resolves a canned failure without
    // running its real read-modify-write) — isolates the responder's handling of a rejected
    // transition from the ledger-append step it must never reach.
    setupModifyFailure: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupResolveFailureOnce();
    },

    // Registers a running process keyed on the follow-up work item's id, the same shape
    // orchestrationProcessesState.findByQuestWorkItemId looks up. The kill callback snapshots
    // whether any quest.json write has landed by the moment it fires, proving the kill ran before
    // either the status-flip persist or the ledger-append persist — not just that it ran at all.
    setupTavernkeeperProcessRunning: ({ workItemId }: { workItemId: QuestWorkItemId }): void => {
      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId: ProcessIdStub({ value: 'proc-tavernkeeper-f47ac10b' }),
          questId: QuestIdStub(),
          questWorkItemId: workItemId,
          kill: (): void => {
            killTracking.called = true;
            killTracking.noQuestWriteYet = opsProxy.getAllPersistedContents().length === 0;
          },
        },
      });
    },

    wasFollowupProcessKilled: (): boolean => killTracking.called,

    wasKilledBeforeAnyQuestWrite: (): boolean => killTracking.noQuestWriteYet,

    getAllPersistedQuests: (): readonly Parsed[] => opsProxy.getAllPersistedQuests(),

    getLastPersistedQuest: (): Parsed => opsProxy.getLastPersistedQuest(),
  };
};
