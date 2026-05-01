import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readFlowSourceLayerBrokerProxy = (): {
  setupReturns: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupReturns: ({ content }: { content: ContentText }): void => {
      fsProxy.returns({ content });
    },

    setupMissing: (): void => {
      fsProxy.throws({ error: new Error('ENOENT') });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
