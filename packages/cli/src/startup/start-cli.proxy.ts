/**
 * Proxy for StartCli integration tests
 */

import { questListBrokerProxy } from '../brokers/quest/list/quest-list-broker.proxy';

export const StartCliProxy = (): Record<PropertyKey, never> => {
  questListBrokerProxy();

  return {};
};
