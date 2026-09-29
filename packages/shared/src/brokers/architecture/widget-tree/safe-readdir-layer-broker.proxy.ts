import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const safeReaddirLayerBrokerProxy = (): {
  setupFiles: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }) => void;
  setupDirs: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }) => void;
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupFiles: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }): void => {
      const entries = names.map((name) => ({ name, kind: 'file' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupDirs: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }): void => {
      const entries = names.map((name) => ({ name, kind: 'directory' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      gatewayProxy.returns({ path: dirPath, entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
