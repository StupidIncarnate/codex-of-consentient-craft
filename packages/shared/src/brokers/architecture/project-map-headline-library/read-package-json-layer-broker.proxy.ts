import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

export const readPackageJsonLayerBrokerProxy = (): {
  setupPackageJson: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupPackageJson: ({ content }: { content: ContentText }): void => {
      fsProxy.returns({ content });
    },

    setupMissing: (): void => {
      fsProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
