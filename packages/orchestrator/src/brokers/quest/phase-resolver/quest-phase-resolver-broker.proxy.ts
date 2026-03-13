import { resolveInProgressLayerBrokerProxy } from './resolve-in-progress-layer-broker.proxy';

export const questPhaseResolverBrokerProxy = (): Record<PropertyKey, never> => {
  resolveInProgressLayerBrokerProxy();

  return {};
};
