import { join } from '#gateway/node/path';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
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
  const readdirProxy = readdirIfExistsProxy();
  const statProxy = fsStatAdapterProxy();
  locationsRunPathsFindBrokerProxy();
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — a shot
  // file's own path is a plain `path.join(shotsDir, fileName)`.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupShotsDir: ({
      shotsDir,
      entries,
    }: {
      shotsDir: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirProxy.returns({ path: shotsDir, names: [...entries] });
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
