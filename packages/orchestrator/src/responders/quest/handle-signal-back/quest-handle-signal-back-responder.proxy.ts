import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { questBlockOnFailureBrokerProxy } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyOrThrowBrokerProxy } from '../../../brokers/quest/modify-or-throw/quest-modify-or-throw-broker.proxy';
import { questPostWalkHookBrokerProxy } from '../../../brokers/quest/post-walk-hook/quest-post-walk-hook-broker.proxy';
import { questRecoverRoleBrokerProxy } from '../../../brokers/quest/recover-role/quest-recover-role-broker.proxy';
import { questSplicePathseekerReplanBrokerProxy } from '../../../brokers/quest/splice-pathseeker-replan/quest-splice-pathseeker-replan-broker.proxy';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const QuestHandleSignalBackResponderProxy = (): {
  callResponder: typeof QuestHandleSignalBackResponder;
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestUnreadable: () => void;
  setupQuestModifyFails: (params: { quest: Quest }) => void;
  setupQuestBlockPassthrough: (params: { quest: Quest }) => void;
  setupWalkHookUuids: (params: { uuids: readonly string[] }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Parsed;
  getRecoverCalls: () => readonly (readonly unknown[])[];
  getReplanCalls: () => readonly (readonly unknown[])[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyOrThrowBrokerProxy();
  const hookProxy = questPostWalkHookBrokerProxy();
  // The PathSeeker-owned block (pathseeker retry exhausted, post-walk hook throw) routes through
  // questBlockOnFailureBroker. By default it is stubbed (setupBlocked); setupQuestBlockPassthrough
  // swaps in the real broker so a test can assert the actual blocked + skipped persisted outcome.
  const blockProxy = questBlockOnFailureBrokerProxy();
  // Code-recovery `failed` delegates to questRecoverRoleBroker; a plan-hole `failed-replan` delegates
  // to questSplicePathseekerReplanBroker. Both are stubbed by default (their end-to-end behavior lives
  // in their own broker tests + the quest-flow integration test); getRecoverCalls / getReplanCalls let
  // a routing test assert the responder delegated with the right args.
  const recoverProxy = questRecoverRoleBrokerProxy();
  const replanProxy = questSplicePathseekerReplanBrokerProxy();

  return {
    callResponder: QuestHandleSignalBackResponder,
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      hookProxy.setupQuest({ quest });
      blockProxy.setupBlocked();
      recoverProxy.setupRecovered();
      replanProxy.setupReplanned();
    },
    // questGetBroker returns { success: false } when the quest file cannot be loaded — a corrupt
    // quest.json or an unresolvable path both land here. The responder must surface this, not silently
    // report success and drop the agent's signal.
    setupQuestUnreadable: (): void => {
      getProxy.setupEmptyFolder();
    },
    // Quest loads fine and the work item is found, but the terminal-transition persist resolves
    // { success: false }. The responder must surface this rather than report success on a dropped write.
    setupQuestModifyFails: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupFailure();
    },
    setupQuestBlockPassthrough: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      hookProxy.setupQuest({ quest });
      // Real block broker: it reloads the quest, marks the failed item `failed`, skips every pending
      // item, and transitions status to `blocked` via its own quest-get/quest-modify.
      blockProxy.setupPassthrough();
      blockProxy.setupQuestFound({ quest });
      recoverProxy.setupRecovered();
      replanProxy.setupReplanned();
    },
    // Queues the UUIDs the post-walk hook's stepsToWorkItemsTransformer consumes for the generated
    // ward/blightwarden/final-ward chain — distinct ids keep the persisted work items unique.
    setupWalkHookUuids: ({ uuids }: { uuids: readonly string[] }): void => {
      hookProxy.setupUuidQueue({ uuids });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
    getLastPersistedQuest: (): Parsed => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(
        JSON.parse(typeof lastWrite === 'string' ? lastWrite : String(lastWrite)),
      );
    },
    getRecoverCalls: (): readonly (readonly unknown[])[] => recoverProxy.getCalls(),
    getReplanCalls: (): readonly (readonly unknown[])[] => replanProxy.getCalls(),
  };
};
