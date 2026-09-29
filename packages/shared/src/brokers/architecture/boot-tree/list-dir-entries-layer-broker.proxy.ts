import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent, DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const listDirEntriesLayerBrokerProxy = (): {
  setupFiles: ({
    dirPath,
    names,
  }: {
    dirPath: AbsoluteFilePath;
    names: string[];
  }) => DirEntrySync[];
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupFiles: ({
      dirPath,
      names,
    }: {
      dirPath: AbsoluteFilePath;
      names: string[];
    }): DirEntrySync[] => {
      const entries = names.map((name) => ({ name, kind: 'file' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
      return entries;
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      gatewayProxy.returns({ path: dirPath, entries: [] });
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
