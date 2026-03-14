import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

export const questPersistBrokerProxy = (): {
  setupPersist: (params: { homePath: FilePath; outboxFilePath: FilePath }) => void;
  setupWriteFailure: (params: { error: Error }) => void;
  setupOutboxFailure: (params: {
    homePath: FilePath;
    outboxFilePath: FilePath;
    error: Error;
  }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const writeFileProxy = fsWriteFileAdapterProxy();
  const outboxProxy = questOutboxAppendBrokerProxy();

  return {
    setupPersist: ({
      homePath,
      outboxFilePath,
    }: {
      homePath: FilePath;
      outboxFilePath: FilePath;
    }): void => {
      writeFileProxy.succeeds();
      outboxProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      writeFileProxy.throws({ error });
    },

    setupOutboxFailure: ({
      homePath,
      outboxFilePath,
      error,
    }: {
      homePath: FilePath;
      outboxFilePath: FilePath;
      error: Error;
    }): void => {
      writeFileProxy.succeeds();
      outboxProxy.setupAppendFailure({ homePath, outboxFilePath, error });
    },

    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),

    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),

    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeFileProxy.getAllWrittenFiles(),
  };
};
