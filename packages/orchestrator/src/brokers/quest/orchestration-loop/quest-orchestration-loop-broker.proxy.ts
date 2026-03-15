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
  setupPathseekerReady: (params: { quest: Quest }) => void;
  setupAborted: () => void;
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

    setupPathseekerReady: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupAborted: (): void => {
      // No setup needed — abort is checked before quest load
    },
  };
};
