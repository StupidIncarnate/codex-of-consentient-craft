import type { DirEntrySync, FsError } from '#gateway/node/fs';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { copyDirContentsProxy } from '#gateway/node/fs__promises/copy-dir-contents/copy-dir-contents.proxy';
import type { AbsoluteFilePath, FileName } from '@dungeonmaster/shared/contracts';

import { cryptoHashAdapterProxy } from '../../../adapters/crypto/hash/crypto-hash-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
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
  // Only same-size pairs ever reach a content read (a size mismatch is decided without one), so a
  // test stages a home/payload pair here exactly when it wants to prove the modified-count decision
  // that DEF-81 governs: equal content must not count, no matter what the two mtimes say.
  setupFileContents: (params: {
    contents: readonly { filePath: AbsoluteFilePath; content: string }[];
  }) => void;
  setupRmSucceeds: (params: { filePaths: readonly AbsoluteFilePath[] }) => void;
  setupCpSucceeds: (params: { sourcePath: AbsoluteFilePath; entries: readonly FileName[] }) => void;
  // The copy is entry by entry, so the failure is staged on the SECOND entry: the first lands, then
  // the gateway removes it from the destination before rethrowing.
  setupCpThrows: (params: {
    sourcePath: AbsoluteFilePath;
    destinationPath: AbsoluteFilePath;
    entries: readonly [FileName, FileName];
    error: FsError;
  }) => void;
  getRemovedPaths: () => unknown[];
  getCopiedFor: (params: { sourcePath: AbsoluteFilePath; entry: FileName }) => unknown;
  getRolledBackFor: (params: { path: AbsoluteFilePath }) => unknown;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const statProxy = fsStatAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const cpProxy = copyDirContentsProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  // createHash is deterministic and pure over its input — see the adapter's own proxy — so this is
  // constructed only to satisfy enforce-proxy-child-creation and never addressed further.
  cryptoHashAdapterProxy();

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

    setupFileContents: ({ contents }): void => {
      contents.forEach(({ filePath, content }) => {
        readFileProxy.resolves({ filePath, content });
      });
    },

    setupRmSucceeds: ({ filePaths }): void => {
      filePaths.forEach((dirPath) => {
        rmProxy.succeeds({ dirPath });
      });
    },

    setupCpSucceeds: ({ sourcePath, entries }): void => {
      cpProxy.succeeds({ from: sourcePath, entries: entries.map(String) });
    },

    setupCpThrows: ({ sourcePath, destinationPath, entries, error }): void => {
      const [first, second] = entries;
      cpProxy.secondEntryFails({
        from: sourcePath,
        to: destinationPath,
        entries: [String(first), String(second)],
        error,
      });
    },

    getRemovedPaths: (): unknown[] => rmProxy.getRemovedPaths(),

    getCopiedFor: ({ sourcePath, entry }): unknown =>
      cpProxy.cpCallsFor({ source: `${String(sourcePath)}/${String(entry)}` }),

    getRolledBackFor: ({ path }): unknown => cpProxy.rmCallsFor({ path }),
  };
};
