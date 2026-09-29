import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const subfolderPathsListLayerBrokerProxy = (): {
  setupDirectory: ({
    dirPath,
    folders,
    files,
  }: {
    dirPath: AbsoluteFilePath;
    folders: readonly string[];
    files: readonly string[];
  }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();

  return {
    setupDirectory: ({
      dirPath,
      folders,
      files,
    }: {
      dirPath: AbsoluteFilePath;
      folders: readonly string[];
      files: readonly string[];
    }): void => {
      readdirProxy.returns({
        path: dirPath,
        entries: [
          ...folders.map((name) => ({ name, kind: 'directory' as const })),
          ...files.map((name) => ({ name, kind: 'file' as const })),
        ],
      });
    },
  };
};
