import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { questGetServerConfigBrokerProxy } from '../../../brokers/quest/get-server-config/quest-get-server-config-broker.proxy';
import { QuestGetServerConfigResponder } from './quest-get-server-config-responder';

export const QuestGetServerConfigResponderProxy = (): {
  callResponder: typeof QuestGetServerConfigResponder;
  setPort: ReturnType<typeof questGetServerConfigBrokerProxy>['setPort'];
} => {
  const brokerProxy = questGetServerConfigBrokerProxy();
  cwdProxy();

  return {
    callResponder: QuestGetServerConfigResponder,
    setPort: brokerProxy.setPort,
  };
};
