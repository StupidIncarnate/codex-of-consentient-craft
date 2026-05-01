import { adapterImportsFindLayerBrokerProxy } from './adapter-imports-find-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const adapterLinesRenderLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const adapterImportsProxy = adapterImportsFindLayerBrokerProxy();

  return {
    setupSource: ({ content }: { content: ContentText }): void => {
      adapterImportsProxy.setupSource({ content });
    },

    setupMissing: (): void => {
      adapterImportsProxy.setupMissing();
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      adapterImportsProxy.setupImplementation({ fn });
    },
  };
};
