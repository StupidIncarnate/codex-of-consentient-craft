import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent, DirEntrySync } from '#gateway/node/fs';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const safeReaddirLayerBrokerProxy = (): {
  setupDirectory: ({
    dirPath,
    entries,
  }: {
    dirPath: string;
    entries: DirEntrySync[];
  }) => DirEntrySync[];
  setupError: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupDirectory: ({
      dirPath,
      entries,
    }: {
      dirPath: string;
      entries: DirEntrySync[];
    }): DirEntrySync[] => {
      gatewayProxy.returns({ path: dirPath, entries });
      return entries;
    },

    setupError: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
