import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { locationsRunPathsFindBrokerProxy } from '../../locations/run-paths-find/locations-run-paths-find-broker.proxy';

export const runShotsLayerBrokerProxy = (): {
  setupShotsDir: (params: { shotsDir: AbsoluteFilePath; entries: readonly string[] }) => void;
  setupShotFile: (params: {
    filePath: AbsoluteFilePath;
    sizeBytes: number;
    modifiedAtMs: number;
  }) => void;
  setupShotFileMissing: (params: { filePath: AbsoluteFilePath }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  locationsRunPathsFindBrokerProxy();
  pathJoinAdapterProxy();

  return {
    setupShotsDir: ({
      shotsDir,
      entries,
    }: {
      shotsDir: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirProxy.resolves({ dirPath: shotsDir, entries });
    },

    setupShotFile: ({
      filePath,
      sizeBytes,
      modifiedAtMs,
    }: {
      filePath: AbsoluteFilePath;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      statProxy.resolves({ filePath, sizeBytes, modifiedAtMs });
    },

    // The race the layer has to survive: an entry listed a moment ago and gone by the time its
    // size is read. `fsStatAdapter` answers null for ENOENT, and the layer drops the row.
    setupShotFileMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.rejects({
        filePath,
        error: Object.assign(new Error(`ENOENT: no such file, stat '${filePath}'`), {
          code: 'ENOENT',
        }),
      });
    },
  };
};
