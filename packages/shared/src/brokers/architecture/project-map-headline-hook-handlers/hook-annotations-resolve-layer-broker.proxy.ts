import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const hookAnnotationsResolveLayerBrokerProxy = (): {
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupMissing: () => void;
} => {
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },

    setupMissing: (): void => {
      readProxy.setupMissing();
    },
  };
};
