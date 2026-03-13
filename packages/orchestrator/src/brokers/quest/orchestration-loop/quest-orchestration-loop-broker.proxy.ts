import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questPhaseResolverBrokerProxy } from '../phase-resolver/quest-phase-resolver-broker.proxy';
import { runCodeweaverLayerBrokerProxy } from './run-codeweaver-layer-broker.proxy';
import { runLawbringerLayerBrokerProxy } from './run-lawbringer-layer-broker.proxy';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';
import { runWardLayerBrokerProxy } from './run-ward-layer-broker.proxy';
import { writeExecutionLogLayerBrokerProxy } from './write-execution-log-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questOrchestrationLoopBrokerProxy = (): {
  setupQuestWaitForUser: (params: { quest: Quest }) => void;
  setupQuestComplete: (params: { quest: Quest }) => void;
  setupQuestBlocked: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupPathseekerPhase: (params: { quest: Quest }) => void;
  setupCodeweaverPhase: (params: { quest: Quest }) => void;
  setupWardPhase: (params: { quest: Quest }) => void;
  setupSiegemasterPhase: (params: { quest: Quest }) => void;
  setupLawbringerPhase: (params: { quest: Quest }) => void;
  setupLaunchChat: (params: { quest: Quest }) => void;
  setupHalt: (params: { quest: Quest }) => void;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  questPhaseResolverBrokerProxy();
  runPathseekerLayerBrokerProxy();
  runCodeweaverLayerBrokerProxy();
  runWardLayerBrokerProxy();
  runSiegemasterLayerBrokerProxy();
  runLawbringerLayerBrokerProxy();
  writeExecutionLogLayerBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupQuestWaitForUser: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupQuestComplete: ({ quest }: { quest: Quest }): void => {
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

    setupPathseekerPhase: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupCodeweaverPhase: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupWardPhase: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupSiegemasterPhase: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupLawbringerPhase: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupLaunchChat: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupHalt: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
  };
};
