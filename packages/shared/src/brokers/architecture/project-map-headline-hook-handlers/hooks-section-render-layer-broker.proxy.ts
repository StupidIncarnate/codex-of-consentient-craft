import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { hookResponderLabelResolveLayerBrokerProxy } from './hook-responder-label-resolve-layer-broker.proxy';
import { hookAnnotationsResolveLayerBrokerProxy } from './hook-annotations-resolve-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const hooksSectionRenderLayerBrokerProxy = (): {
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupMissing: () => void;
} => {
  const readProxy = readSourceLayerBrokerProxy();
  hookResponderLabelResolveLayerBrokerProxy();
  hookAnnotationsResolveLayerBrokerProxy();

  return {
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },

    setupMissing: (): void => {
      readProxy.setupMissing();
    },
  };
};
