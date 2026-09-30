import type { Dirent } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const buildDirent = ({ name, isDir }: { name: string; isDir: boolean }): DirEntrySync => ({
  name,
  kind: isDir ? 'directory' : 'file',
});

export const listSourceFilesLayerBrokerProxy = (): {
  setupFlatDirectory: ({
    dirPath,
    filePaths,
  }: {
    dirPath: string;
    filePaths: string[];
  }) => void;
  setupEmpty: ({ dirPath }: { dirPath: string }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatDirectory: ({
      dirPath,
      filePaths,
    }: {
      dirPath: string;
      filePaths: string[];
    }): void => {
      const entries = filePaths.map((fp) => {
        const name = String(fp).split('/').pop() ?? String(fp);
        return buildDirent({ name, isDir: false });
      });
      readdirProxy.setupDirectory({ dirPath, entries });
    },

    setupEmpty: ({ dirPath }: { dirPath: string }): void => {
      readdirProxy.setupDirectory({ dirPath, entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
