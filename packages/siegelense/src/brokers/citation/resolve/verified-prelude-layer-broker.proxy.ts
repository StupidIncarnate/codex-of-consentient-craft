import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { locationsCitationQuestPlansPathFindBrokerProxy } from '../../locations/citation-quest-plans-path-find/locations-citation-quest-plans-path-find-broker.proxy';

export const verifiedPreludeLayerBrokerProxy = (): {
  setupPlansDir: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
  setupNotADirectory: (params: { dirPath: AbsoluteFilePath }) => void;
  setupPlanFile: (params: { filePath: AbsoluteFilePath; contents: string }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  errorIsNativeErrorAdapterProxy();
  locationsCitationQuestPlansPathFindBrokerProxy();
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — every
  // nested/plan-file path this broker joins (plansDir + name, nestedDir + entryName) is already
  // known at test-setup time, since every scenario below stages `setupPlansDir`/`setupPlanFile`
  // against the real concatenation of those same segments.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupPlansDir: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      readdirProxy.resolves({ dirPath, entries });
    },

    // An entry the scan tried to descend into that turns out to be an ordinary file. The OS says
    // ENOTDIR, and the layer treats it as "nothing to read here" rather than crashing the prune.
    setupNotADirectory: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readdirProxy.rejects({
        dirPath,
        error: Object.assign(new Error(`ENOTDIR: not a directory, scandir '${dirPath}'`), {
          code: 'ENOTDIR',
        }),
      });
    },

    setupPlanFile: ({
      filePath,
      contents,
    }: {
      filePath: AbsoluteFilePath;
      contents: string;
    }): void => {
      readFileProxy.resolves({ filePath, content: contents });
    },
  };
};
