import { checkUnboundTypePropertiesLayerBrokerProxy } from './check-unbound-type-properties-layer-broker.proxy';

export const ruleEnforceProxyParamBindingBrokerProxy = (): Record<PropertyKey, never> => {
  checkUnboundTypePropertiesLayerBrokerProxy();
  return {};
};
