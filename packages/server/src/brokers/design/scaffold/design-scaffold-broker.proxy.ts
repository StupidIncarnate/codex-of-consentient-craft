import {
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
  locationsDesignScaffoldPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

// designScaffoldBroker writes these four scaffold files under a designPath computed at call
// time from arguments (guildPath, questFolder) this proxy never sees — only the file NAMES are
// known ahead of time, so writes are addressed by filename suffix rather than full path.
const SCAFFOLD_FILE_NAMES = ['package.json', 'vite.config.js', 'index.html', 'main.jsx'];

export const designScaffoldBrokerProxy = (): {
  setupWriteError: (params: { error: Error }) => void;
} => {
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  locationsDesignScaffoldPathFindBrokerProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  for (const fileName of SCAFFOLD_FILE_NAMES) {
    writeProxy.succeeds({ filePath: (value) => String(value).endsWith(`/${fileName}`) });
  }

  return {
    setupWriteError: ({ error }: { error: Error }): void => {
      // package.json is the first write in designScaffoldBroker's Promise.all array, so it's
      // the deterministic real address for "a write fails" regardless of the caller's designPath.
      writeProxy.throws({
        filePath: (value) => String(value).endsWith('/package.json'),
        error,
      });
    },
  };
};
