import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const ExecutionQueueGetAllResponderProxy = (): {
  setupEmpty: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const stateProxy = questExecutionQueueStateProxy();
  const getProxy = questGetBrokerProxy();
  return {
    setupEmpty: (): void => {
      stateProxy.setupEmpty();
    },
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
  };
};
