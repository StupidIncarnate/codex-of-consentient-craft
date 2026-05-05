import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readSourceTextLayerBrokerProxy = (): {
  setupReturns: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fileProxy = fsReadFileSyncAdapterProxy();
  return {
    setupReturns: ({ content }: { content: ContentText }): void => {
      fileProxy.returns({ content });
    },
    setupMissing: (): void => {
      fileProxy.throws({ error: new Error('ENOENT') });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fileProxy.implementation({ fn });
    },
  };
};
