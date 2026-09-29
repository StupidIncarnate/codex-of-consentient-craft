import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent, DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const safeReaddirLayerBrokerProxy = (): {
  setupReaddirThrows: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupReaddirReturns: ({
    dirPath,
    entries,
  }: {
    dirPath: AbsoluteFilePath;
    entries: DirEntrySync[];
  }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupReaddirThrows: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },
    setupReaddirReturns: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: DirEntrySync[];
    }): void => {
      gatewayProxy.returns({ path: dirPath, entries });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
