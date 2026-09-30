import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent, DirEntrySync } from '#gateway/node/fs';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const listDirEntriesLayerBrokerProxy = (): {
  setupFiles: ({ dirPath, names }: { dirPath: string; names: string[] }) => DirEntrySync[];
  setupEmpty: ({ dirPath }: { dirPath: string }) => void;
  setupError: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupFiles: ({ dirPath, names }: { dirPath: string; names: string[] }): DirEntrySync[] => {
      const entries = names.map((name) => ({ name, kind: 'file' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
      return entries;
    },

    setupEmpty: ({ dirPath }: { dirPath: string }): void => {
      gatewayProxy.returns({ path: dirPath, entries: [] });
    },

    setupError: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
