import { readFlowSourceLayerBrokerProxy } from './read-flow-source-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const toolsSectionRenderLayerBrokerProxy = (): {
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const readProxy = readFlowSourceLayerBrokerProxy();

  return {
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },
  };
};
