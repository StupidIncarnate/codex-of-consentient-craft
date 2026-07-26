import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';

export const readSourceLayerBrokerProxy = (): {
  returns: ({ filePath, content }: { filePath: AbsoluteFilePath; content: ContentText }) => void;
  throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }) => void;
  implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    returns: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      fsProxy.returns({ filePath, content });
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      fsProxy.throws({ filePath, error });
    },

    implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
