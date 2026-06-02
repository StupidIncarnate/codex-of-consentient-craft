import {
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
  findPersistedWorkItem: (params: {
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => WorkItem | undefined;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  configProxy.setupConfigResolved({ config: configProxy.makeRealConfig() });
  // Chat layer is the only remaining role-specific dispatch in the loop —
  // chaoswhisperer / glyphsmith still flow through the legacy spawn surface.
  // Every execution role (codeweaver, ward, siegemaster, lawbringer,
  // blightwarden, spiritmender, pathseeker) is dispatched by /dumpster-launch
  // via the MCP `get-next-step` tool now.
  runChatLayerBrokerProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

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
