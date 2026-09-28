import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

const TMP_SUFFIX = '.tmp';

const QUEST_FILE_SUFFIX = `/${locationsStatics.quest.questFile}`;

const isQuestFilePath = (value: unknown): boolean =>
  typeof value === 'string' && value.endsWith(QUEST_FILE_SUFFIX);

const isQuestTmpPath = (value: unknown): boolean =>
  typeof value === 'string' && value.endsWith(`${QUEST_FILE_SUFFIX}${TMP_SUFFIX}`);

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
  const writeHandle = writeFileProxy();
  const renameHandle = renameProxy();
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
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.succeeds({ from: tmpPath, to: questFilePath });
      outboxProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupWriteFailure: ({
      questFilePath,
      error,
    }: {
      questFilePath: FilePath;
      error: Error;
    }): void => {
      writeHandle.rejects({
        path: tmpPathFor({ questFilePath }),
        error: Object.assign(error, { code: 'EIO' }),
      });
    },

    setupRenameFailure: ({
      questFilePath,
      error,
    }: {
      questFilePath: FilePath;
      error: Error;
    }): void => {
      const tmpPath = tmpPathFor({ questFilePath });
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.rejects({
        from: tmpPath,
        to: questFilePath,
        error: Object.assign(error, { code: 'EIO' }),
      });
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
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.succeeds({ from: tmpPath, to: questFilePath });
      outboxProxy.setupAppendFailure({
        homePath,
        outboxFilePath,
        error: Object.assign(error, { code: 'EIO' }),
      });
    },

    getWrittenContent: ({ questFilePath }: { questFilePath: FilePath }): unknown =>
      writeHandle.writtenContentsFor({ path: tmpPathFor({ questFilePath }) }),

    // Trivial echo of the known tmp address — the write having actually landed there is proven
    // by getWrittenContent returning a value; a caller that only wants the path (the atomic-write
    // pattern check) doesn't need to re-derive it.
    getWrittenPath: ({ questFilePath }: { questFilePath: FilePath }): unknown =>
      tmpPathFor({ questFilePath }),

    // Every quest persist any staging in this test made: a quest file's tmp write, matched by the
    // `quest.json.tmp` name the broker derives, so a persist staged through another proxy that
    // composes this broker reads back too.
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeHandle
        .getCallsFor({ path: isQuestTmpPath })
        .map((call) => ({ path: call[0], content: call[1] })),

    getAllRenames: (): readonly { from: unknown; to: unknown }[] =>
      renameHandle
        .getCallsFor({ from: isQuestTmpPath, to: isQuestFilePath })
        .map((call) => ({ from: call[0], to: call[1] })),
  };
};
