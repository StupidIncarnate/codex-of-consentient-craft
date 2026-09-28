import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, RiftcarverResult } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';

const LOG_EXTENSION = '.log';

// riftcarverPersistResultBroker joins questFolderPath + riftcarverResultsDir +
// `${riftcarverResultId}.log` through the gateway's own join — this proxy replicates the same
// join to key the write mock (and the ensureDir stage) on the real resulting addresses.
const riftcarverResultsDirFor = ({ questFolderPath }: { questFolderPath: FilePath }): FilePath =>
  filePathContract.parse(`${questFolderPath}/${locationsStatics.quest.riftcarverResultsDir}`);

const logFilePathFor = ({
  questFolderPath,
  riftcarverResultId,
}: {
  questFolderPath: FilePath;
  riftcarverResultId: RiftcarverResult['id'];
}): FilePath =>
  filePathContract.parse(
    `${questFolderPath}/${locationsStatics.quest.riftcarverResultsDir}/${String(riftcarverResultId)}${LOG_EXTENSION}`,
  );

export const riftcarverPersistResultBrokerProxy = (): {
  setupSuccess: (params: {
    questFolderPath: FilePath;
    riftcarverResultId: RiftcarverResult['id'];
  }) => void;
  setupWriteFailure: (params: {
    questFolderPath: FilePath;
    riftcarverResultId: RiftcarverResult['id'];
    error: Error;
  }) => void;
  getWrittenContent: (params: {
    questFolderPath: FilePath;
    riftcarverResultId: RiftcarverResult['id'];
  }) => unknown;
  getWrittenPath: (params: {
    questFolderPath: FilePath;
    riftcarverResultId: RiftcarverResult['id'];
  }) => unknown;
  getMkdirPaths: () => readonly unknown[];
} => {
  const joinHandle: MockHandle = registerMock({ fn: join });
  const ensureDirHandle = ensureDirProxy();
  const writeHandle = writeFileProxy();

  return {
    setupSuccess: ({ questFolderPath, riftcarverResultId }): void => {
      const riftcarverResultsDir = riftcarverResultsDirFor({ questFolderPath });
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.riftcarverResultsDir])
        .returns(riftcarverResultsDir);
      ensureDirHandle.succeeds({ path: riftcarverResultsDir });
      joinHandle
        .calledWith([riftcarverResultsDir, `${String(riftcarverResultId)}${LOG_EXTENSION}`])
        .returns(logFilePathFor({ questFolderPath, riftcarverResultId }));
      writeHandle.succeeds({ path: logFilePathFor({ questFolderPath, riftcarverResultId }) });
    },

    setupWriteFailure: ({ questFolderPath, riftcarverResultId, error }): void => {
      const riftcarverResultsDir = riftcarverResultsDirFor({ questFolderPath });
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.riftcarverResultsDir])
        .returns(riftcarverResultsDir);
      ensureDirHandle.succeeds({ path: riftcarverResultsDir });
      joinHandle
        .calledWith([riftcarverResultsDir, `${String(riftcarverResultId)}${LOG_EXTENSION}`])
        .returns(logFilePathFor({ questFolderPath, riftcarverResultId }));
      writeHandle.rejects({
        path: logFilePathFor({ questFolderPath, riftcarverResultId }),
        error: Object.assign(error, { code: 'EIO' }),
      });
    },

    getWrittenContent: ({ questFolderPath, riftcarverResultId }): unknown =>
      writeHandle.writtenContentsFor({
        path: logFilePathFor({ questFolderPath, riftcarverResultId }),
      }),

    getWrittenPath: ({ questFolderPath, riftcarverResultId }): unknown =>
      logFilePathFor({ questFolderPath, riftcarverResultId }),

    getMkdirPaths: (): readonly unknown[] =>
      ensureDirHandle.getCallsFor({ path: () => true }).map((call) => call[0]),
  };
};
