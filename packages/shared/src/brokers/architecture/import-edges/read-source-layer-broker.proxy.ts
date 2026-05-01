import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

export const readSourceLayerBrokerProxy = (): {
  returns: ({ content }: { content: ContentText }) => void;
  throws: ({ error }: { error: Error }) => void;
  implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    returns: ({ content }: { content: ContentText }): void => {
      fsProxy.returns({ content });
    },

    throws: ({ error }: { error: Error }): void => {
      fsProxy.throws({ error });
    },

    implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
