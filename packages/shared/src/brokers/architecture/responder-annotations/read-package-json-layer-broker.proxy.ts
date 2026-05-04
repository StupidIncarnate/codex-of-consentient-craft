import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readPackageJsonLayerBrokerProxy = (): {
  setupJson: ({ json }: { json: unknown }) => void;
  setupMissing: () => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupJson: ({ json }: { json: unknown }): void => {
      fsProxy.returns({ content: JSON.stringify(json) as ContentText });
    },

    setupMissing: (): void => {
      fsProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
