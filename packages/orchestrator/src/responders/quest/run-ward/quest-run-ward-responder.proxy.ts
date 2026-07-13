import { questRunWardBrokerProxy } from '../../../brokers/quest/run-ward/quest-run-ward-broker.proxy';
import { QuestRunWardResponder } from './quest-run-ward-responder';

export const QuestRunWardResponderProxy = (): {
  callResponder: typeof QuestRunWardResponder;
  setupQuest: ReturnType<typeof questRunWardBrokerProxy>['setupQuest'];
  wardExits: ReturnType<typeof questRunWardBrokerProxy>['wardExits'];
  wardExitsWithoutRunId: ReturnType<typeof questRunWardBrokerProxy>['wardExitsWithoutRunId'];
} => {
  const brokerProxy = questRunWardBrokerProxy();

  return {
    callResponder: QuestRunWardResponder,
    setupQuest: brokerProxy.setupQuest,
    wardExits: brokerProxy.wardExits,
    wardExitsWithoutRunId: brokerProxy.wardExitsWithoutRunId,
  };
};
