import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { routeEntryLinesRenderLayerBrokerProxy } from './route-entry-lines-render-layer-broker.proxy';

export const routesSectionRenderLayerBrokerProxy = (): {
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const routeEntryProxy = routeEntryLinesRenderLayerBrokerProxy();

  return {
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      routeEntryProxy.setupImplementation({ fn });
    },
  };
};
