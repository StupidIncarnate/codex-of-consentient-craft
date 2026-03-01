import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { QuestGetResponder } from './quest-get-responder';

export const QuestGetResponderProxy = (): {
  callResponder: typeof QuestGetResponder;
  setupQuestFound: ReturnType<typeof questGetBrokerProxy>['setupQuestFound'];
  setupEmptyFolder: ReturnType<typeof questGetBrokerProxy>['setupEmptyFolder'];
} => {
  const brokerProxy = questGetBrokerProxy();

  return {
    callResponder: QuestGetResponder,
    setupQuestFound: brokerProxy.setupQuestFound,
    setupEmptyFolder: brokerProxy.setupEmptyFolder,
  };
};
