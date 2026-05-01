import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const routeEntryLinesRenderLayerBrokerProxy = (): {
  setupReturns: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setupReturns: ({ content }: { content: ContentText }): void => {
      readProxy.setupReturns({ content });
    },
    setupMissing: (): void => {
      readProxy.setupMissing();
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },
  };
};
