import { questVerifyBrokerProxy } from '../../../brokers/quest/verify/quest-verify-broker.proxy';
import { QuestVerifyResponder } from './quest-verify-responder';

export const QuestVerifyResponderProxy = (): {
  callResponder: typeof QuestVerifyResponder;
  setupQuestFound: ReturnType<typeof questVerifyBrokerProxy>['setupQuestFound'];
  setupEmptyFolder: ReturnType<typeof questVerifyBrokerProxy>['setupEmptyFolder'];
} => {
  const brokerProxy = questVerifyBrokerProxy();

  return {
    callResponder: QuestVerifyResponder,
    setupQuestFound: brokerProxy.setupQuestFound,
    setupEmptyFolder: brokerProxy.setupEmptyFolder,
  };
};
