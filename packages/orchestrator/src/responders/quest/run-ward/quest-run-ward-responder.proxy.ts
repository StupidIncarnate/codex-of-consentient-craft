import { questRunWardBrokerProxy } from '../../../brokers/quest/run-ward/quest-run-ward-broker.proxy';
import { QuestRunWardResponder } from './quest-run-ward-responder';

export const QuestRunWardResponderProxy = (): {
  callResponder: typeof QuestRunWardResponder;
  setupWardPass: ReturnType<typeof questRunWardBrokerProxy>['setupWardPass'];
  setupWardFail: ReturnType<typeof questRunWardBrokerProxy>['setupWardFail'];
} => {
  const brokerProxy = questRunWardBrokerProxy();

  return {
    callResponder: QuestRunWardResponder,
    setupWardPass: brokerProxy.setupWardPass,
    setupWardFail: brokerProxy.setupWardFail,
  };
};
