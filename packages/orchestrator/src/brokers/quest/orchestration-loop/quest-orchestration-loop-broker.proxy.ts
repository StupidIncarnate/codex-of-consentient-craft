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
import { runBlightwardenLayerBrokerProxy } from './run-blightwarden-layer-broker.proxy';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';
import { runCodeweaverLayerBrokerProxy } from './run-codeweaver-layer-broker.proxy';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';
import { runSpiritmenderLayerBrokerProxy } from './run-spiritmender-layer-broker.proxy';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';

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
  // Layer-broker children must be instantiated so enforce-proxy-child-creation
  // is satisfied even though the parent no longer dispatches through them — the
  // orchestration loop's role-specific dispatch table moved to
  // `quest-get-next-step-broker` under the `/dumpster-launch` model.
  runBlightwardenLayerBrokerProxy();
  runChatLayerBrokerProxy();
  runCodeweaverLayerBrokerProxy();
  runLawbringerLayerBrokerProxy();
  runSiegemasterLayerBrokerProxy();
  runSpiritmenderLayerBrokerProxy();
  runWardLayerBrokerProxy();

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
