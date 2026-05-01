import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { exemplarBoundaryBoxRenderLayerBrokerProxy } from './exemplar-boundary-box-render-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const exemplarSectionRenderLayerBrokerProxy = (): {
  setupReturns: ({ content }: { content: ContentText }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupMissing: () => void;
} => {
  exemplarBoundaryBoxRenderLayerBrokerProxy();
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setupReturns: ({ content }: { content: ContentText }): void => {
      readProxy.setupReturns({ content });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },
    setupMissing: (): void => {
      readProxy.setupMissing();
    },
  };
};
