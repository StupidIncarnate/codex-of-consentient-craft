import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { questPauseBroker } from '../../../brokers/quest/pause/quest-pause-broker';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questPauseBrokerProxy } from '../../../brokers/quest/pause/quest-pause-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationPauseResponder } from './orchestration-pause-responder';

type Quest = ReturnType<typeof QuestStub>;
type PauseArgs = Parameters<typeof questPauseBroker>[0];

export const OrchestrationPauseResponderProxy = (): {
  callResponder: typeof OrchestrationPauseResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupPauseBrokerReturnsNotPaused: (params: { quest: Quest }) => void;
  getPauseBrokerCalls: () => readonly PauseArgs[];
} => {
  const getProxy = questGetBrokerProxy();
  const pauseProxy = questPauseBrokerProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  return {
    callResponder: OrchestrationPauseResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      pauseProxy.setupPaused();
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupPauseBrokerReturnsNotPaused: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      pauseProxy.setupNotPaused();
    },

    getPauseBrokerCalls: (): readonly PauseArgs[] => {
      const raw = pauseProxy.getCallArgs();
      return raw.map((callArgs) => callArgs[0] as PauseArgs);
    },
  };
};
