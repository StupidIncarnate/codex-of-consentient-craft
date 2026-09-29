import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import {
  questContract,
  type Quest,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import { configResolveBrokerProxy } from '@dungeonmaster/config/config-resolve-caller.proxy';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';

type QuestParam = ReturnType<typeof QuestStub>;

// Every questOrchestrationLoopBroker.test.ts call site passes this same startPath, which is
// what the broker forwards to configResolveBroker — the real, distinguishing address every
// config-resolve call in this suite resolves.
const START_PATH = FilePathStub({ value: '/project/src' });

const parsePersistedQuests = ({
  modifyProxy,
}: {
  modifyProxy: ReturnType<typeof questModifyBrokerProxy>;
}): readonly Quest[] =>
  modifyProxy
    .getAllPersistedContents()
    .map((content) => questContract.parse(JSON.parse(String(content))));

export const questOrchestrationLoopBrokerProxy = (): {
  setupQuestTerminal: (params: { quest: QuestParam }) => void;
  setupQuestBlocked: (params: { quest: QuestParam }) => void;
  setupQuestReady: (params: { quest: QuestParam }) => void;
  setupQuestNotFound: () => void;
  setupNoReadyItems: (params: { quest: QuestParam }) => void;
  setupChatDispatchThrows: (params: { quest: QuestParam }) => void;
  setupInProgressMarkFails: () => void;
  getSpawnedArgs: () => unknown;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Quest[];
  getStderrWrites: () => readonly unknown[];
  findPersistedWorkItem: (params: {
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => WorkItem | undefined;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  // Composes config's own black-box caller proxy (F18) rather than mocking configResolveBroker
  // directly here, and rather than composing config's colocated config-resolve-broker.proxy:
  // that proxy mocks configResolveBroker's OWN internal dependencies, one of which
  // (@dungeonmaster/shared's configRootFindBroker) is a broker this package's own quest/guild
  // path resolution also calls for real — composing it here globally mocks that shared broker
  // for the whole test FILE (registerMock's hoisted jest.mock() has no per-test-case
  // granularity), breaking real path resolution in every OTHER responder proxy that also wires
  // this broker in as a child (recover-guild-layer-responder, orchestration-resume-responder),
  // even though neither ever calls a method on it.
  const configProxy = configResolveBrokerProxy();
  configProxy.setupResolves({ filePath: START_PATH, config: DungeonmasterConfigStub() });
  // Chat layer is the only remaining role-specific dispatch in the loop —
  // chaoswhisperer / bughunt still flow through the legacy spawn surface.
  // Every execution role (codeweaver, ward, flowrider, siegemaster, spiritmender)
  // is dispatched by the Node dispatch loop.
  const chatLayerProxy = runChatLayerBrokerProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  // Capture (and suppress) the loop's diagnostic stderr so tests can assert the snapshot +
  // decision lines instead of leaking them into the jest reporter. Every diagnostic line is
  // built dynamically per branch, so there is no address to key on — this proxy answers every
  // write() the SAME way (record + succeed) regardless of content, which is what `calledWith([])`
  // (the lowest-specificity, always-matching address) honestly describes. The loop never reads
  // write()'s return value, so the fixed `true` answer is inert.
  const stderrChild = stderrProxy();

  return {
    setupQuestTerminal: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestBlocked: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestReady: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupNoReadyItems: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
    },

    // A dispatch that throws (rather than recursing) is what lets a unit test reach the
    // dispatch branch at all: questOrchestrationLoopBroker recurses on itself after a
    // successful dispatch, and this suite's staged quest fixture never changes between
    // recursive re-fetches, so a successful dispatch would loop forever.
    setupChatDispatchThrows: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      chatLayerProxy.setupSpawnThrow({ quest });
    },

    // Stages a one-shot failure for the NEXT real questModifyBroker call — the dispatch
    // branch's own "mark the work item in_progress" write, which is the first questModifyBroker
    // call this broker makes in a dispatch scenario.
    setupInProgressMarkFails: (): void => {
      modifyProxy.setupResolveFailureOnce();
    },

    // The Claude CLI argv the chat layer spawned with, or `undefined` when the loop declined to
    // dispatch and no child was ever launched. The single piece of evidence that separates
    // "a chat agent ran" from "the loop stopped short of running one".
    getSpawnedArgs: (): unknown => chatLayerProxy.getSpawnedArgs(),

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getAllPersistedQuests: (): readonly Quest[] => parsePersistedQuests({ modifyProxy }),

    getStderrWrites: (): readonly unknown[] => stderrChild.getWrites(),

    findPersistedWorkItem: ({
      workItemId,
      status,
    }: {
      workItemId: QuestWorkItemId;
      status: WorkItemStatus;
    }): WorkItem | undefined => {
      const quests = parsePersistedQuests({ modifyProxy });
      for (const quest of quests) {
        const match = quest.workItems.find((wi) => wi.id === workItemId && wi.status === status);
        if (match) {
          return match;
        }
      }
      return undefined;
    },
  };
};
