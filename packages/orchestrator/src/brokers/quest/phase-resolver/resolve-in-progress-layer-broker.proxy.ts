import { resolveCodeweaverLayerBrokerProxy } from './resolve-codeweaver-layer-broker.proxy';
import { resolveLawbringerLayerBrokerProxy } from './resolve-lawbringer-layer-broker.proxy';
import { resolvePathseekerLayerBrokerProxy } from './resolve-pathseeker-layer-broker.proxy';
import { resolveSiegemasterLayerBrokerProxy } from './resolve-siegemaster-layer-broker.proxy';
import { resolveWardLayerBrokerProxy } from './resolve-ward-layer-broker.proxy';

export const resolveInProgressLayerBrokerProxy = (): Record<PropertyKey, never> => {
  resolveCodeweaverLayerBrokerProxy();
  resolveLawbringerLayerBrokerProxy();
  resolvePathseekerLayerBrokerProxy();
  resolveSiegemasterLayerBrokerProxy();
  resolveWardLayerBrokerProxy();

  return {};
};
