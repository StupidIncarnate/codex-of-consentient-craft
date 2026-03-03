import { questAddBrokerProxy } from '../../../brokers/quest/add/quest-add-broker.proxy';
import { QuestAddResponder } from './quest-add-responder';

export const QuestAddResponderProxy = (): {
  callResponder: typeof QuestAddResponder;
  setupQuestCreation: ReturnType<typeof questAddBrokerProxy>['setupQuestCreation'];
  setupQuestCreationFailure: ReturnType<typeof questAddBrokerProxy>['setupQuestCreationFailure'];
} => {
  const brokerProxy = questAddBrokerProxy();

  return {
    callResponder: QuestAddResponder,
    setupQuestCreation: brokerProxy.setupQuestCreation,
    setupQuestCreationFailure: brokerProxy.setupQuestCreationFailure,
  };
};
