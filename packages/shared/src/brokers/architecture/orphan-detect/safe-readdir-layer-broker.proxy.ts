import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent, DirEntrySync } from '#gateway/node/fs';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const safeReaddirLayerBrokerProxy = (): {
  setupReaddirThrows: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
  setupReaddirReturns: ({ dirPath, entries }: { dirPath: string; entries: DirEntrySync[] }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupReaddirThrows: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },
    setupReaddirReturns: ({
      dirPath,
      entries,
    }: {
      dirPath: string;
      entries: DirEntrySync[];
    }): void => {
      gatewayProxy.returns({ path: dirPath, entries });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
