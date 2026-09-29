import { join } from '#gateway/node/path';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
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
  const statProxy = statIfExistsProxy();
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
      statProxy.returnsFile({ path: filePath, sizeBytes, modifiedAtMs });
    },

    // The race the layer has to survive: an entry listed a moment ago and gone by the time its
    // size is read. `statIfExists` answers null for ENOENT, and the layer drops the row.
    setupShotFileMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.missing({ path: filePath });
    },
  };
};
