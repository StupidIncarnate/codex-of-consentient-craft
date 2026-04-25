import { questUserAddBrokerProxy } from '../../../brokers/quest/user-add/quest-user-add-broker.proxy';
import { QuestUserAddResponder } from './quest-user-add-responder';

export const QuestUserAddResponderProxy = (): {
  callResponder: typeof QuestUserAddResponder;
  setupQuestCreation: ReturnType<typeof questUserAddBrokerProxy>['setupQuestCreation'];
  setupCreateFailure: ReturnType<typeof questUserAddBrokerProxy>['setupCreateFailure'];
} => {
  const brokerProxy = questUserAddBrokerProxy();

  return {
    callResponder: QuestUserAddResponder,
    setupQuestCreation: brokerProxy.setupQuestCreation,
    setupCreateFailure: brokerProxy.setupCreateFailure,
  };
};
