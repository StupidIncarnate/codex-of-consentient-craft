/**
 * PURPOSE: Proxy for useQuestsListBinding that delegates to broker proxy
 *
 * USAGE:
 * const proxy = useQuestsListBindingProxy();
 * proxy.setupQuests({ quests });
 */
import { questListBrokerProxy } from '../../brokers/quest/list/quest-list-broker.proxy';

export const useQuestsListBindingProxy = (): {
  brokerProxy: ReturnType<typeof questListBrokerProxy>;
} => {
  const brokerProxy = questListBrokerProxy();

  return {
    brokerProxy,
  };
};
