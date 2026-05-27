import { questGetServerConfigBrokerProxy } from '../../../brokers/quest/get-server-config/quest-get-server-config-broker.proxy';
import { QuestGetServerConfigResponder } from './quest-get-server-config-responder';

export const QuestGetServerConfigResponderProxy = (): {
  callResponder: typeof QuestGetServerConfigResponder;
  setPort: ReturnType<typeof questGetServerConfigBrokerProxy>['setPort'];
} => {
  const brokerProxy = questGetServerConfigBrokerProxy();

  return {
    callResponder: QuestGetServerConfigResponder,
    setPort: brokerProxy.setPort,
  };
};
