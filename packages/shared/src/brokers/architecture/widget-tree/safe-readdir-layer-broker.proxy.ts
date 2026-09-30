import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { Dirent } from '#gateway/node/fs';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const safeReaddirLayerBrokerProxy = (): {
  setupFiles: ({ dirPath, names }: { dirPath: string; names: string[] }) => void;
  setupDirs: ({ dirPath, names }: { dirPath: string; names: string[] }) => void;
  setupEmpty: ({ dirPath }: { dirPath: string }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();

  return {
    setupFiles: ({ dirPath, names }: { dirPath: string; names: string[] }): void => {
      const entries = names.map((name) => ({ name, kind: 'file' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupDirs: ({ dirPath, names }: { dirPath: string; names: string[] }): void => {
      const entries = names.map((name) => ({ name, kind: 'directory' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupEmpty: ({ dirPath }: { dirPath: string }): void => {
      gatewayProxy.returns({ path: dirPath, entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      gatewayProxy.implementsRawMatchingPath({ path: isAbsolutePath, fn });
    },
  };
};
