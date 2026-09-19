import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

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
  pathJoinAdapterProxy();

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
