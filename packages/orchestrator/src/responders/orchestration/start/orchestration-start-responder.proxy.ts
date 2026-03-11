import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questPipelineLaunchBrokerProxy } from '../../../brokers/quest/pipeline-launch/quest-pipeline-launch-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationStartResponder } from './orchestration-start-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationStartResponderProxy = (): {
  callResponder: typeof OrchestrationStartResponder;
  setupQuestApproved: (params: { quest: Quest; questJson: string; exitCode: ExitCode }) => void;
  setupQuestInProgressRestart: (params: {
    quest: Quest;
    questJson: string;
    exitCode: ExitCode;
  }) => void;
  setupQuestNotApproved: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupModifyFailure: (params: { quest: Quest }) => void;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const launchProxy = questPipelineLaunchBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    callResponder: OrchestrationStartResponder,

    setupQuestApproved: ({
      quest,
      questJson,
      exitCode,
    }: {
      quest: Quest;
      questJson: string;
      exitCode: ExitCode;
    }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      launchProxy.setupLaunch({ quest, questJson, exitCode });
    },

    setupQuestInProgressRestart: ({
      quest,
      questJson,
      exitCode,
    }: {
      quest: Quest;
      questJson: string;
      exitCode: ExitCode;
    }): void => {
      getProxy.setupQuestFound({ quest });
      launchProxy.setupLaunch({ quest, questJson, exitCode });
    },

    setupQuestNotApproved: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupModifyFailure: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupEmptyFolder();
    },
  };
};
