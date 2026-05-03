import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const importsInFolderTypeFindLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupTsExists: ({ result }: { result: boolean }) => void;
  setupTsxExists: ({ result }: { result: boolean }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();
  const existsProxy = fsExistsSyncAdapterProxy();

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

    setupTsExists: ({ result }: { result: boolean }): void => {
      existsProxy.returns({ result });
    },

    setupTsxExists: ({ result }: { result: boolean }): void => {
      existsProxy.returns({ result });
    },
  };
};
