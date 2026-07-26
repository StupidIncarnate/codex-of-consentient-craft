import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

const TMP_SUFFIX = '.tmp';

// questPersistBroker writes to `${questFilePath}.tmp` then renames it onto questFilePath — the
// same derivation the broker itself uses. Callers pass questFilePath (which they already compute
// to seed quest-find/load) so the write/rename mocks key on the real address instead of a
// blanket catch-all, and the getters below take the same param instead of remembering "the last
// address staged" (which would collide if a test staged more than one questFilePath).
const tmpPathFor = ({ questFilePath }: { questFilePath: FilePath }): FilePath =>
  filePathContract.parse(`${questFilePath}${TMP_SUFFIX}`);

export const questPersistBrokerProxy = (): {
  setupPersist: (params: {
    questFilePath: FilePath;
    homePath: FilePath;
    outboxFilePath: FilePath;
  }) => void;
  setupWriteFailure: (params: { questFilePath: FilePath; error: Error }) => void;
  setupRenameFailure: (params: { questFilePath: FilePath; error: Error }) => void;
  setupOutboxFailure: (params: {
    questFilePath: FilePath;
    homePath: FilePath;
    outboxFilePath: FilePath;
    error: Error;
  }) => void;
  getWrittenContent: (params: { questFilePath: FilePath }) => unknown;
  getWrittenPath: (params: { questFilePath: FilePath }) => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
  getAllRenames: () => readonly { from: unknown; to: unknown }[];
} => {
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  const outboxProxy = questOutboxAppendBrokerProxy();

  return {
    setupPersist: ({
      questFilePath,
      homePath,
      outboxFilePath,
    }: {
      questFilePath: FilePath;
      homePath: FilePath;
      outboxFilePath: FilePath;
    }): void => {
      const tmpPath = tmpPathFor({ questFilePath });
      writeFileProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
      outboxProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupWriteFailure: ({
      questFilePath,
      error,
    }: {
      questFilePath: FilePath;
      error: Error;
    }): void => {
      writeFileProxy.throws({ filePath: tmpPathFor({ questFilePath }), error });
    },

    setupRenameFailure: ({
      questFilePath,
      error,
    }: {
      questFilePath: FilePath;
      error: Error;
    }): void => {
      const tmpPath = tmpPathFor({ questFilePath });
      writeFileProxy.succeeds({ filePath: tmpPath });
      renameProxy.throws({ from: tmpPath, error });
    },

    setupOutboxFailure: ({
      questFilePath,
      homePath,
      outboxFilePath,
      error,
    }: {
      questFilePath: FilePath;
      homePath: FilePath;
      outboxFilePath: FilePath;
      error: Error;
    }): void => {
      const tmpPath = tmpPathFor({ questFilePath });
      writeFileProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
      outboxProxy.setupAppendFailure({ homePath, outboxFilePath, error });
    },

    getWrittenContent: ({ questFilePath }: { questFilePath: FilePath }): unknown =>
      writeFileProxy.getWrittenFor({ filePath: tmpPathFor({ questFilePath }) }),

    // Trivial echo of the known tmp address — the write having actually landed there is proven
    // by getWrittenContent returning a value; a caller that only wants the path (the atomic-write
    // pattern check) doesn't need to re-derive it.
    getWrittenPath: ({ questFilePath }: { questFilePath: FilePath }): unknown =>
      tmpPathFor({ questFilePath }),

    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeFileProxy.getAllWrittenFiles(),

    getAllRenames: (): readonly { from: unknown; to: unknown }[] => renameProxy.getAllRenames(),
  };
};
