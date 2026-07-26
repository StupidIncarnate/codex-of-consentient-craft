import {
  FilePathStub,
  questContract,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';

type QuestParam = ReturnType<typeof QuestStub>;

// Every questOrchestrationLoopBroker.test.ts call site passes this same startPath, which is
// what the broker forwards to dungeonmasterConfigResolveAdapter — the real, distinguishing
// address every config-resolve call in this suite resolves.
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
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  configProxy.setupConfigResolved({ startPath: START_PATH, config: configProxy.makeRealConfig() });
  // Chat layer is the only remaining role-specific dispatch in the loop —
  // chaoswhisperer / glyphsmith still flow through the legacy spawn surface.
  // Every execution role (codeweaver, ward, flowrider, siegemaster, lawbringer,
  // blightwarden, spiritmender, pesteater) is dispatched by /dumpster-launch
  // via the MCP `get-next-step` tool now.
  runChatLayerBrokerProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  // Capture (and suppress) the loop's diagnostic stderr so tests can assert the snapshot +
  // decision lines instead of leaking them into the jest reporter. Every diagnostic line is
  // built dynamically per branch, so there is no address to key on — this proxy answers every
  // write() the SAME way (record + succeed) regardless of content, which is what `calledWith([])`
  // (the lowest-specificity, always-matching address) honestly describes. The loop never reads
  // write()'s return value, so the fixed `true` answer is inert.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);

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

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getAllPersistedQuests: (): readonly Quest[] => parsePersistedQuests({ modifyProxy }),

    getStderrWrites: (): readonly unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),

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
