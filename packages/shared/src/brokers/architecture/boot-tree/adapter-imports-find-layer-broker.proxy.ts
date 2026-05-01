import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const adapterImportsFindLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();

  return {
    setupSource: ({ content }: { content: ContentText }): void => {
      importsProxy.setupSource({ content });
    },

    setupMissing: (): void => {
      importsProxy.setupMissing();
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      importsProxy.setupImplementation({ fn });
    },
  };
};
