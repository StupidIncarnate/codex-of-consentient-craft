import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { adapterLinesRenderLayerBrokerProxy } from './adapter-lines-render-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const responderLinesRenderLayerBrokerProxy = (): {
  setupFlowSource: ({ content }: { content: ContentText }) => void;
  setupAdapterSource: ({ content }: { content: ContentText }) => void;
  setupFlowMissing: () => void;
  setupAdapterMissing: () => void;
  setupFlowImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupAdapterImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const flowImportsProxy = importsInFolderTypeFindLayerBrokerProxy();
  const adapterRenderProxy = adapterLinesRenderLayerBrokerProxy();

  return {
    setupFlowSource: ({ content }: { content: ContentText }): void => {
      flowImportsProxy.setupSource({ content });
    },

    setupAdapterSource: ({ content }: { content: ContentText }): void => {
      adapterRenderProxy.setupSource({ content });
    },

    setupFlowMissing: (): void => {
      flowImportsProxy.setupMissing();
    },

    setupAdapterMissing: (): void => {
      adapterRenderProxy.setupMissing();
    },

    setupFlowImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      flowImportsProxy.setupImplementation({ fn });
    },

    setupAdapterImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      adapterRenderProxy.setupImplementation({ fn });
    },
  };
};
