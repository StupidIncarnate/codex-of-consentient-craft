import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent, DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const safeReaddirLayerBrokerProxy = (): {
  setupDirectory: ({
    dirPath,
    entries,
  }: {
    dirPath: AbsoluteFilePath;
    entries: DirEntrySync[];
  }) => void;
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupDirectory: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: DirEntrySync[];
    }): void => {
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
