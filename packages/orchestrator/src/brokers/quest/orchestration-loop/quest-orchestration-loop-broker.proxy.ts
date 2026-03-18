import {
  questContract,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { runChatLayerBroker as chatLayer } from './run-chat-layer-broker';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';
import { runCodeweaverLayerBroker as cwLayer } from './run-codeweaver-layer-broker';
import { runCodeweaverLayerBrokerProxy } from './run-codeweaver-layer-broker.proxy';
import { runLawbringerLayerBroker as lbLayer } from './run-lawbringer-layer-broker';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';
import { runPathseekerLayerBroker as psLayer } from './run-pathseeker-layer-broker';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';
import { runSiegemasterLayerBroker as smLayer } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';
import { runSpiritmenderLayerBroker as spLayer } from './run-spiritmender-layer-broker';
import { runSpiritmenderLayerBrokerProxy } from './run-spiritmender-layer-broker.proxy';
import { runWardLayerBroker as wardLayer } from './run-ward-layer-broker';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';

jest.mock('./run-chat-layer-broker');
jest.mock('./run-codeweaver-layer-broker');
jest.mock('./run-lawbringer-layer-broker');
jest.mock('./run-pathseeker-layer-broker');
jest.mock('./run-siegemaster-layer-broker');
jest.mock('./run-spiritmender-layer-broker');
jest.mock('./run-ward-layer-broker');

type QuestParam = ReturnType<typeof QuestStub>;

const layerMocks = (): void => {
  jest.mocked(chatLayer).mockResolvedValue(undefined);
  jest.mocked(cwLayer).mockResolvedValue(undefined);
  jest.mocked(lbLayer).mockResolvedValue(undefined);
  jest.mocked(psLayer).mockResolvedValue(undefined);
  jest.mocked(smLayer).mockResolvedValue(undefined);
  jest.mocked(spLayer).mockResolvedValue(undefined);
  jest.mocked(wardLayer).mockResolvedValue(undefined);
};

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
  setupChatRoleReady: (params: { quest: QuestParam }) => void;
  setupPathseekerReady: (params: { quest: QuestParam }) => void;
  setupAborted: () => void;
  setupLayerThrows: (params: { quest: QuestParam; error: Error }) => void;
  setupLayerThrowsWithCatchFailure: (params: { quest: QuestParam; error: Error }) => void;
  setupChatDispatchWithRecursion: (params: {
    firstQuest: QuestParam;
    secondQuest: QuestParam;
  }) => void;
  setupRecoveryFromBlocked: (params: {
    blockedQuest: QuestParam;
    terminalQuest: QuestParam;
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Quest[];
  findPersistedWorkItem: (params: {
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => WorkItem | undefined;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  runChatLayerBrokerProxy();
  runPathseekerLayerBrokerProxy();
  runCodeweaverLayerBrokerProxy();
  runWardLayerBrokerProxy();
  runSiegemasterLayerBrokerProxy();
  runLawbringerLayerBrokerProxy();
  runSpiritmenderLayerBrokerProxy();

  layerMocks();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

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

    setupChatRoleReady: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupPathseekerReady: ({ quest }: { quest: QuestParam }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupAborted: (): void => {
      // No setup needed — abort is checked before quest load
    },

    setupLayerThrows: ({ quest, error }: { quest: QuestParam; error: Error }): void => {
      // Loop: initial quest load
      getProxy.setupQuestFound({ quest });
      // Loop: mark items in_progress
      modifyProxy.setupQuestFound({ quest });
      // Loop catch: mark items failed
      modifyProxy.setupQuestFound({ quest });
      // Loop catch: re-fetch quest
      getProxy.setupQuestFound({ quest });
      // Loop catch: update quest status
      modifyProxy.setupQuestFound({ quest });

      jest.mocked(psLayer).mockRejectedValueOnce(error);
    },

    setupLayerThrowsWithCatchFailure: ({
      quest,
      error,
    }: {
      quest: QuestParam;
      error: Error;
    }): void => {
      // Loop: initial quest load
      getProxy.setupQuestFound({ quest });
      // Loop: mark items in_progress
      modifyProxy.setupQuestFound({ quest });

      jest.mocked(psLayer).mockRejectedValueOnce(error);

      // Catch block: no modify mocks queued, so questModifyBroker returns { success: false }
      // Original error still propagates due to inner try/catch in catch block
    },

    setupChatDispatchWithRecursion: ({
      firstQuest,
      secondQuest,
    }: {
      firstQuest: QuestParam;
      secondQuest: QuestParam;
    }): void => {
      // First iteration: load quest with chat ready
      getProxy.setupQuestFound({ quest: firstQuest });
      // Mark chat item in_progress
      modifyProxy.setupQuestFound({ quest: firstQuest });

      // Chat layer resolves (jest.mock auto-returns undefined = success)

      // Recursion: load quest with second chat ready but no userMessage
      getProxy.setupQuestFound({ quest: secondQuest });
      modifyProxy.setupQuestFound({ quest: secondQuest });
    },

    setupRecoveryFromBlocked: ({
      blockedQuest,
      terminalQuest,
    }: {
      blockedQuest: QuestParam;
      terminalQuest: QuestParam;
    }): void => {
      // First iteration: load blocked quest that has ready items
      getProxy.setupQuestFound({ quest: blockedQuest });
      // Mark ready item in_progress
      modifyProxy.setupQuestFound({ quest: blockedQuest });

      // Layer resolves (jest.mock auto-returns undefined = success)

      // Recursion: load terminal quest
      getProxy.setupQuestFound({ quest: terminalQuest });
      // Terminal state may modify quest status
      modifyProxy.setupQuestFound({ quest: terminalQuest });
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
