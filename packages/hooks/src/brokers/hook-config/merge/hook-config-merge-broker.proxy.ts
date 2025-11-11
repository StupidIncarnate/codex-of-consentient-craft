import { hookConfigDefaultBrokerProxy } from '../default/hook-config-default-broker.proxy';

export const hookConfigMergeBrokerProxy = (): Record<PropertyKey, never> => {
  hookConfigDefaultBrokerProxy();

  return {};
};
