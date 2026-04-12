import { questValidateSpecBrokerProxy } from '../../../brokers/quest/validate-spec/quest-validate-spec-broker.proxy';
import { QuestValidateSpecResponder } from './quest-validate-spec-responder';

export const QuestValidateSpecResponderProxy = (): {
  callResponder: typeof QuestValidateSpecResponder;
  setupQuestFound: ReturnType<typeof questValidateSpecBrokerProxy>['setupQuestFound'];
  setupEmptyFolder: ReturnType<typeof questValidateSpecBrokerProxy>['setupEmptyFolder'];
} => {
  const brokerProxy = questValidateSpecBrokerProxy();

  return {
    callResponder: QuestValidateSpecResponder,
    setupQuestFound: brokerProxy.setupQuestFound,
    setupEmptyFolder: brokerProxy.setupEmptyFolder,
  };
};
