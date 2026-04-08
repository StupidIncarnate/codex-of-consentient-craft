import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readPackageDescriptionLayerBrokerProxy = (): {
  setupDescription: ({ description }: { description: ContentText }) => void;
  setupNoPackageJson: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupDescription: ({ description }: { description: ContentText }): void => {
      fsProxy.returns({
        content: JSON.stringify({ description }) as ContentText,
      });
    },

    setupNoPackageJson: (): void => {
      fsProxy.throws({ error: new Error('ENOENT') });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
