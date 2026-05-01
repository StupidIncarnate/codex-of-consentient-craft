import { widgetNodeRenderLayerBrokerProxy } from './widget-node-render-layer-broker.proxy';

export const widgetTreeSectionRenderLayerBrokerProxy = (): Record<PropertyKey, never> => {
  widgetNodeRenderLayerBrokerProxy();
  return {};
};
