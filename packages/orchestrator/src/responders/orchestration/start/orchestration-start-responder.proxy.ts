import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationStartResponder } from './orchestration-start-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationStartResponderProxy = (): {
  callResponder: typeof OrchestrationStartResponder;
  setupQuestApproved: (params: { quest: Quest }) => void;
  setupQuestNotApproved: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupModifyFailure: (params: { quest: Quest }) => void;
} => {
  const getBrokerProxy = questGetBrokerProxy();
  const modifyBrokerProxy = questModifyBrokerProxy();
  const stateProxy = orchestrationProcessesStateProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    callResponder: OrchestrationStartResponder,

    setupQuestApproved: ({ quest }: { quest: Quest }): void => {
      stateProxy.setupEmpty();
      getBrokerProxy.setupQuestFound({ quest });
      modifyBrokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotApproved: ({ quest }: { quest: Quest }): void => {
      stateProxy.setupEmpty();
      getBrokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      stateProxy.setupEmpty();
      getBrokerProxy.setupEmptyFolder();
    },

    setupModifyFailure: ({ quest }: { quest: Quest }): void => {
      stateProxy.setupEmpty();
      getBrokerProxy.setupQuestFound({ quest });
      const completeQuest = QuestStub({ id: quest.id, status: 'complete' });
      modifyBrokerProxy.setupQuestFound({ quest: completeQuest });
    },
  };
};
