import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { questBlockOnFailureBrokerProxy } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questPostWalkHookBrokerProxy } from '../../../brokers/quest/post-walk-hook/quest-post-walk-hook-broker.proxy';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { RecoverLawbringerLayerResponderProxy } from './recover-lawbringer-layer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const QuestHandleSignalBackResponderProxy = (): {
  callResponder: typeof QuestHandleSignalBackResponder;
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestBlockPassthrough: (params: { quest: Quest }) => void;
  setupWalkHookUuids: (params: { uuids: readonly string[] }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Parsed;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const hookProxy = questPostWalkHookBrokerProxy();
  // BLOCK path (codeweaver/siege/spiritmender/blightwarden/pathseeker-*/pesteater failures)
  // routes through questBlockOnFailureBroker. By default it is stubbed (setupBlocked) so the
  // status-transition tests don't drive the real block flow; setupQuestBlockPassthrough swaps
  // in the real broker so a test can assert the actual blocked + skipped persisted outcome.
  const blockProxy = questBlockOnFailureBrokerProxy();
  // Instantiated to satisfy enforce-proxy-child-creation (parent imports the layer responder).
  // The lawbringer RECOVER branch is exercised in the layer responder's own test.
  RecoverLawbringerLayerResponderProxy();

  return {
    callResponder: QuestHandleSignalBackResponder,
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      hookProxy.setupQuest({ quest });
      blockProxy.setupBlocked();
    },
    setupQuestBlockPassthrough: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      hookProxy.setupQuest({ quest });
      // Real block broker: it reloads the quest, marks the failed item `failed`, skips every
      // pending item, and transitions status to `blocked` via its own quest-get/quest-modify.
      blockProxy.setupPassthrough();
      blockProxy.setupQuestFound({ quest });
    },
    // Queues the UUIDs the post-walk hook's stepsToWorkItemsTransformer consumes for the
    // generated ward/blightwarden/final-ward chain — distinct ids keep the persisted work
    // items unique (the hook's modify rejects duplicate sibling ids otherwise).
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
  };
};
