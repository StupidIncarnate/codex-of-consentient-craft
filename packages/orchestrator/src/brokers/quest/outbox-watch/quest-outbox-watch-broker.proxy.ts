import {
  dungeonmasterHomeEnsureBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

export const questOutboxWatchBrokerProxy = (): {
  setupOutboxPath: (params: { homeDir: string; homePath: FilePath; outboxPath: FilePath }) => void;
  triggerChange: () => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerWatchError: (params: { error: Error }) => void;
  getTruncatedPaths: () => readonly unknown[];
  getCreatedPaths: () => readonly unknown[];
} => {
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const appendFileProxy = fsAppendFileAdapterProxy();
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
      homeEnsureProxy.setupEnsureSuccess({
        homeDir,
        homePath,
        guildsPath: homePath,
      });
      pathJoinProxy.returns({ result: outboxPath });
      appendFileProxy.succeeds({ filePath: outboxPath });
      writeFileProxy.succeeds({ filePath: outboxPath });
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

    // `writeFile` is the truncate and `appendFile` the create-if-absent, so which of the two the
    // broker reached for IS the observable "did this watcher destroy the bus it came to read".
    getTruncatedPaths: (): readonly unknown[] =>
      writeFileProxy.getAllWrittenFiles().map((written) => written.path),

    getCreatedPaths: (): readonly unknown[] =>
      appendFileProxy.getAllAppendedFiles().map((appended) => appended.path),
  };
};
