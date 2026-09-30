import type { DirEntrySync, FsError } from '#gateway/node/fs';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { copyDirContentsProxy } from '#gateway/node/fs__promises/copy-dir-contents/copy-dir-contents.proxy';
import type { FileName } from '@dungeonmaster/shared/contracts';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import type { FileSizeBytes } from '../../../contracts/file-size-bytes/file-size-bytes-contract';

export const snapshotRestoreLayerBrokerProxy = (): {
  setupDirectories: (params: {
    dirs: readonly { dirPath: string; entries: readonly DirEntrySync[] }[];
  }) => void;
  setupFileStats: (params: {
    stats: readonly {
      filePath: string;
      sizeBytes: FileSizeBytes;
      modifiedAtMs: number;
    }[];
  }) => void;
  // Only same-size pairs ever reach a content read (a size mismatch is decided without one), so a
  // test stages a home/payload pair here exactly when it wants to prove the modified-count decision
  // that DEF-81 governs: equal content must not count, no matter what the two mtimes say.
  setupFileContents: (params: {
    contents: readonly { filePath: string; content: string }[];
  }) => void;
  setupRmSucceeds: (params: { filePaths: readonly string[] }) => void;
  setupCpSucceeds: (params: { sourcePath: string; entries: readonly FileName[] }) => void;
  // The copy is entry by entry, so the failure is staged on the SECOND entry: the first lands, then
  // the gateway removes it from the destination before rethrowing.
  setupCpThrows: (params: {
    sourcePath: string;
    destinationPath: string;
    entries: readonly [FileName, FileName];
    error: FsError;
  }) => void;
  getRemovedPaths: () => unknown[];
  getCopiedFor: (params: { sourcePath: string; entry: FileName }) => unknown;
  getRolledBackFor: (params: { path: string }) => unknown;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const statProxy = statIfExistsProxy();
  const removeProxy = rmProxy();
  // Read-back addresses only the paths this test staged; an unstaged rm already throws.
  const stagedRmPaths: string[] = [];
  const cpProxy = copyDirContentsProxy();
  const readProxy = readFileProxy();

  return {
    setupDirectories: ({ dirs }): void => {
      dirs.forEach(({ dirPath, entries }) => {
        readdirProxy.returns({ path: dirPath, entries });
      });
    },

    setupFileStats: ({ stats }): void => {
      stats.forEach(({ filePath, sizeBytes, modifiedAtMs }) => {
        statProxy.returnsFile({ path: filePath, sizeBytes, modifiedAtMs });
      });
    },

    setupFileContents: ({ contents }): void => {
      contents.forEach(({ filePath, content }) => {
        readProxy.returns({ path: filePath, contents: content });
      });
    },

    setupRmSucceeds: ({ filePaths }): void => {
      filePaths.forEach((dirPath) => {
        stagedRmPaths.push(dirPath);
        removeProxy.succeeds({ path: dirPath });
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

    getRemovedPaths: (): unknown[] =>
      removeProxy
        .getCallsFor({
          path: (value: unknown): boolean => stagedRmPaths.some((path) => path === value),
        })
        .map((call) => call[0]),

    getCopiedFor: ({ sourcePath, entry }): unknown =>
      cpProxy.cpCallsFor({ source: `${String(sourcePath)}/${String(entry)}` }),

    getRolledBackFor: ({ path }): unknown => cpProxy.rmCallsFor({ path }),
  };
};
