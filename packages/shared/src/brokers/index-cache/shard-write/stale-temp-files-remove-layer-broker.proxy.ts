import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { statSyncProxy } from '#gateway/node/fs/stat-sync/stat-sync.proxy';
import { unlinkSyncProxy } from '#gateway/node/fs/unlink-sync/unlink-sync.proxy';
import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { locationsStatics } from '../../../statics/locations/locations-statics';
import { indexCacheStatics } from '../../../statics/index-cache/index-cache-statics';

export const staleTempFilesRemoveLayerBrokerProxy = (): {
  setupNow: ({ ms }: { ms: number }) => void;
  setupTempFiles: ({
    cacheDir,
    files,
  }: {
    cacheDir: string;
    files: readonly { name: string; modifiedAtMs: number }[];
  }) => void;
  setupUnlinkFails: ({ path, code }: { path: string; code: string }) => void;
  setupUnlistableCacheDir: ({ cacheDir }: { cacheDir: string }) => void;
  unlinkCalls: ({ path }: { path: string }) => unknown[][];
  stderrText: () => string;
} => {
  isFsErrorProxy();
  const readdirProxy = readdirEntriesSyncProxy();
  const statProxy = statSyncProxy();
  const unlinkProxy = unlinkSyncProxy();
  const clockProxy = nowProxy();
  const errorOutput = stderrProxy();

  // Every repo root's cache folders start with no temp files, and the clock reads the epoch, so a
  // test that is not about cleanup needs no staging for it. An exact stage outranks both.
  const cacheRoot = `/${[locationsStatics.repoRoot.nodeModules, ...indexCacheStatics.rootFolderNames].join('/')}/`;
  readdirProxy.returnsMatchingPath({
    path: (value: unknown): boolean => typeof value === 'string' && value.includes(cacheRoot),
    entries: [],
  });
  clockProxy.setupNow({ ms: 0 });

  return {
    setupNow: ({ ms }: { ms: number }): void => {
      clockProxy.setupNow({ ms });
    },

    setupTempFiles: ({
      cacheDir,
      files,
    }: {
      cacheDir: string;
      files: readonly { name: string; modifiedAtMs: number }[];
    }): void => {
      readdirProxy.returns({
        path: cacheDir,
        entries: files.map(({ name }) => ({ name, kind: 'file' as const })),
      });
      for (const { name, modifiedAtMs } of files) {
        statProxy.returns({
          path: `${cacheDir}/${name}`,
          kind: 'file',
          sizeBytes: 1,
          modifiedAtMs,
        });
        unlinkProxy.succeeds({ path: `${cacheDir}/${name}` });
      }
    },

    setupUnlinkFails: ({ path, code }: { path: string; code: string }): void => {
      unlinkProxy.throws({ path, error: FsErrorStub({ code, path, syscall: 'unlink' }) });
    },

    setupUnlistableCacheDir: ({ cacheDir }: { cacheDir: string }): void => {
      readdirProxy.throws({
        path: cacheDir,
        error: FsErrorStub({ code: 'EACCES', path: cacheDir, syscall: 'scandir' }),
      });
    },

    unlinkCalls: ({ path }: { path: string }): unknown[][] => unlinkProxy.calls({ path }),

    stderrText: (): string => errorOutput.getWrittenText(),
  };
};
