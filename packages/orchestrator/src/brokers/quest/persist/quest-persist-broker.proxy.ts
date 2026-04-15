import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

export const questPersistBrokerProxy = (): {
  setupPersist: (params: { homePath: FilePath; outboxFilePath: FilePath }) => void;
  setupWriteFailure: (params: { error: Error }) => void;
  setupRenameFailure: (params: { error: Error }) => void;
  setupOutboxFailure: (params: {
    homePath: FilePath;
    outboxFilePath: FilePath;
    error: Error;
  }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
  getRenameFrom: () => unknown;
  getRenameTo: () => unknown;
  getAllRenames: () => readonly { from: unknown; to: unknown }[];
} => {
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
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
      renameProxy.succeeds();
      outboxProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      writeFileProxy.throws({ error });
    },

    setupRenameFailure: ({ error }: { error: Error }): void => {
      writeFileProxy.succeeds();
      renameProxy.throws({ error });
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
      renameProxy.succeeds();
      outboxProxy.setupAppendFailure({ homePath, outboxFilePath, error });
    },

    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),

    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),

    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeFileProxy.getAllWrittenFiles(),

    getRenameFrom: (): unknown => renameProxy.getFromPath(),

    getRenameTo: (): unknown => renameProxy.getToPath(),

    getAllRenames: (): readonly { from: unknown; to: unknown }[] => renameProxy.getAllRenames(),
  };
};
