import {
  questContract,
  type QuestStatus,
  type QuestWorkItemId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { runChatLayerBrokerProxy } from './run-chat-layer-broker.proxy';
import { runCodeweaverLayerBrokerProxy } from './run-codeweaver-layer-broker.proxy';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';
import { runSpiritmenderLayerBrokerProxy } from './run-spiritmender-layer-broker.proxy';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questOrchestrationLoopBrokerProxy = (): {
  setupQuestTerminal: (params: { quest: Quest }) => void;
  setupQuestBlocked: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupNoReadyItems: (params: { quest: Quest }) => void;
  setupChatRoleReady: (params: { quest: Quest }) => void;
  setupChatDispatch: (params: { quest: Quest }) => void;
  setupPathseekerReady: (params: { quest: Quest }) => void;
  setupLayerBrokerThrows: (params: { quest: Quest }) => void;
  setupAborted: () => void;
  setupDispatchThenTerminal: (params: { questBefore: Quest; questAfter: Quest }) => void;
  setupDispatchThenReturn: (params: { questBefore: Quest; questAfter: Quest }) => void;
  setupDispatchTwiceThenTerminal: (params: { quest1: Quest; quest2: Quest; quest3: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuestStatus: () => QuestStatus | undefined;
  getPersistedWorkItemById: (params: {
    workItemId: QuestWorkItemId;
    index?: number;
  }) => WorkItem | undefined;
  getPersistedQuestAt: (params: { index: number }) => ReturnType<typeof questContract.parse>;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const chatLayerProxy = runChatLayerBrokerProxy();
  runPathseekerLayerBrokerProxy();
  runCodeweaverLayerBrokerProxy();
  runWardLayerBrokerProxy();
  runSiegemasterLayerBrokerProxy();
  runLawbringerLayerBrokerProxy();
  runSpiritmenderLayerBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupQuestTerminal: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestBlocked: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupNoReadyItems: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupChatRoleReady: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupChatDispatch: ({ quest }: { quest: Quest }): void => {
      // Quest get for the loop's initial load
      getProxy.setupQuestFound({ quest });
      // Quest modify for in_progress marking
      modifyProxy.setupQuestFound({ quest });
      // Chat layer broker needs: spawn success + quest modify for completion
      chatLayerProxy.setupSpawnSuccess({ quest, lines: [] });
    },

    setupPathseekerReady: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupLayerBrokerThrows: ({ quest }: { quest: Quest }): void => {
      // Loop loads quest (first get) — quest has chaoswhisperer pending
      getProxy.setupQuestFound({ quest });
      // Mark items in_progress (first modify)
      modifyProxy.setupQuestFound({ quest });
      // Chat layer broker: spawn throws → chat catch marks failed + re-throws
      // Chat catch calls questModifyBroker (mark failed) — needs modify setup
      chatLayerProxy.setupSpawnThrow({ quest });
      // Orchestration loop catch: mark items failed (another modify)
      modifyProxy.setupQuestFound({ quest });
      // Orchestration loop catch: re-fetch quest (second get)
      getProxy.setupQuestFound({ quest });
    },

    setupAborted: (): void => {
      // No setup needed — abort is checked before quest load
    },

    setupDispatchThenTerminal: ({
      questBefore,
      questAfter,
    }: {
      questBefore: Quest;
      questAfter: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest: questBefore });
      modifyProxy.setupQuestFound({ quest: questBefore });
      getProxy.setupQuestFound({ quest: questAfter });
      modifyProxy.setupQuestFound({ quest: questAfter });
    },

    setupDispatchThenReturn: ({
      questBefore,
      questAfter,
    }: {
      questBefore: Quest;
      questAfter: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest: questBefore });
      modifyProxy.setupQuestFound({ quest: questBefore });
      getProxy.setupQuestFound({ quest: questAfter });
      modifyProxy.setupQuestFound({ quest: questAfter });
    },

    setupDispatchTwiceThenTerminal: ({
      quest1,
      quest2,
      quest3,
    }: {
      quest1: Quest;
      quest2: Quest;
      quest3: Quest;
    }): void => {
      getProxy.setupQuestFound({ quest: quest1 });
      modifyProxy.setupQuestFound({ quest: quest1 });
      getProxy.setupQuestFound({ quest: quest2 });
      modifyProxy.setupQuestFound({ quest: quest2 });
      getProxy.setupQuestFound({ quest: quest3 });
      modifyProxy.setupQuestFound({ quest: quest3 });
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedQuestStatus: (): QuestStatus | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length === 0) {
        return undefined;
      }
      const raw = persisted[persisted.length - 1];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const quest = questContract.parse(parsed);
      return quest.status;
    },

    getPersistedWorkItemById: ({
      workItemId,
      index = 0,
    }: {
      workItemId: QuestWorkItemId;
      index?: number;
    }): WorkItem | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length <= index) {
        return undefined;
      }
      const raw = persisted[index];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const quest = questContract.parse(parsed);
      return quest.workItems.find((wi) => wi.id === workItemId);
    },

    getPersistedQuestAt: ({ index }: { index: number }): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const entry = persisted[index];
      return questContract.parse(JSON.parse(String(entry)));
    },
  };
};
