import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { exemplarBoundaryBoxRenderLayerBrokerProxy } from './exemplar-boundary-box-render-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const exemplarSectionRenderLayerBrokerProxy = (): {
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const readProxy = readSourceLayerBrokerProxy();
  exemplarBoundaryBoxRenderLayerBrokerProxy();

  return {
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },
  };
};
