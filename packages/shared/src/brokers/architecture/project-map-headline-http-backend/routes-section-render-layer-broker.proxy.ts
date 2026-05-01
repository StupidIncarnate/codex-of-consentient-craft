import { routeEntryLinesRenderLayerBrokerProxy } from './route-entry-lines-render-layer-broker.proxy';

export const routesSectionRenderLayerBrokerProxy = (): Record<PropertyKey, never> => {
  routeEntryLinesRenderLayerBrokerProxy();
  return {};
};
