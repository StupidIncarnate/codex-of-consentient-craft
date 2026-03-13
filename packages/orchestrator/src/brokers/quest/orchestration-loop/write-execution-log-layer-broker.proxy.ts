import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

export const writeExecutionLogLayerBrokerProxy = (): Record<PropertyKey, never> => {
  questModifyBrokerProxy();

  return {};
};
