import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

export const questOutboxWatchBrokerProxy = (): {
  setupOutboxPath: (params: { homeDir: string; homePath: FilePath; outboxPath: FilePath }) => void;
  triggerChange: () => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerWatchError: (params: { error: Error }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const watchTailProxy = fsWatchTailAdapterProxy();

  return {
    setupOutboxPath: ({
      homeDir,
      homePath,
      outboxPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      outboxPath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: outboxPath });
      writeFileProxy.succeeds();
    },

    triggerChange: (): void => {
      watchTailProxy.triggerChange();
    },

    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      watchTailProxy.setupLines({ lines });
    },

    triggerWatchError: ({ error }: { error: Error }): void => {
      watchTailProxy.triggerWatchError({ error });
    },
  };
};
