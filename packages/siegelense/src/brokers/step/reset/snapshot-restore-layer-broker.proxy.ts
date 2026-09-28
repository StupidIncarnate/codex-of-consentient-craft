import type { DirEntrySync } from '#gateway/node/fs';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { AbsoluteFilePath, FileName } from '@dungeonmaster/shared/contracts';

import { fsCpAdapterProxy } from '../../../adapters/fs/cp/fs-cp-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { FileSizeBytes } from '../../../contracts/file-size-bytes/file-size-bytes-contract';

export const snapshotRestoreLayerBrokerProxy = (): {
  setupDirectories: (params: {
    dirs: readonly { dirPath: AbsoluteFilePath; entries: readonly DirEntrySync[] }[];
  }) => void;
  setupFileStats: (params: {
    stats: readonly {
      filePath: AbsoluteFilePath;
      sizeBytes: FileSizeBytes;
      modifiedAtMs: EpochMs;
    }[];
  }) => void;
  setupRmSucceeds: (params: { filePaths: readonly AbsoluteFilePath[] }) => void;
  setupCpSucceeds: (params: {
    sourcePath: AbsoluteFilePath;
    destinationPath: AbsoluteFilePath;
    entries: readonly FileName[];
  }) => void;
  setupCpThrows: (params: {
    sourcePath: AbsoluteFilePath;
    destinationPath: AbsoluteFilePath;
    entries: readonly FileName[];
    error: Error;
  }) => void;
  getRemovedPaths: () => unknown[];
  getCopiedPairs: () => unknown[][];
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const statProxy = fsStatAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const cpProxy = fsCpAdapterProxy();

  return {
    setupDirectories: ({ dirs }): void => {
      dirs.forEach(({ dirPath, entries }) => {
        readdirProxy.returns({ path: dirPath, entries });
      });
    },

    setupFileStats: ({ stats }): void => {
      stats.forEach(({ filePath, sizeBytes, modifiedAtMs }) => {
        statProxy.resolves({ filePath, sizeBytes, modifiedAtMs });
      });
    },

    setupRmSucceeds: ({ filePaths }): void => {
      filePaths.forEach((dirPath) => {
        rmProxy.succeeds({ dirPath });
      });
    },

    setupCpSucceeds: ({ sourcePath, destinationPath, entries }): void => {
      cpProxy.succeeds({
        sourcePath,
        destinationPath,
        entries: entries.map(String),
      });
    },

    setupCpThrows: ({ sourcePath, destinationPath, entries, error }): void => {
      cpProxy.throws({
        sourcePath,
        destinationPath,
        entries: entries.map(String),
        error,
      });
    },

    getRemovedPaths: (): unknown[] => rmProxy.getRemovedPaths(),

    getCopiedPairs: (): unknown[][] => cpProxy.getCopiedPairs(),
  };
};
