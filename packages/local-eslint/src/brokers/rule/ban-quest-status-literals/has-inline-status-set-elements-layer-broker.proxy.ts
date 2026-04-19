import { hasInlineStatusSetElementsLayerBroker as implementation } from './has-inline-status-set-elements-layer-broker';

export const hasInlineStatusSetElementsLayerBrokerProxy = (): {
  hasInlineStatusSetElementsLayerBroker: typeof implementation;
} => ({
  hasInlineStatusSetElementsLayerBroker: implementation,
});
