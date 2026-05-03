import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const routeMetadataExtractLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();

  return {
    setupSource: ({ content }: { content: ContentText }): void => {
      fileProxy.setupReturns({ content });
    },
    setupMissing: (): void => {
      fileProxy.setupMissing();
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fileProxy.setupImplementation({ fn });
    },
  };
};
