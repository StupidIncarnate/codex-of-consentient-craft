import type { WardResult, FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';

const JSON_EXTENSION = '.json';

// wardPersistResultBroker joins questFolderPath + wardResultsDir + `${wardResultId}.json` through
// the gateway's own join — this proxy replicates that same join to key the write mock (and the
// ensureDir stage) on the real, resulting addresses.
const wardResultsDirFor = ({ questFolderPath }: { questFolderPath: FilePath }): FilePath =>
  filePathContract.parse(`${questFolderPath}/${locationsStatics.quest.wardResultsDir}`);

const resultFilePathFor = ({
  questFolderPath,
  wardResultId,
}: {
  questFolderPath: FilePath;
  wardResultId: WardResult['id'];
}): FilePath =>
  filePathContract.parse(
    `${questFolderPath}/${locationsStatics.quest.wardResultsDir}/${wardResultId}${JSON_EXTENSION}`,
  );

export const wardPersistResultBrokerProxy = (): {
  setupSuccess: (params: { questFolderPath: FilePath; wardResultId: WardResult['id'] }) => void;
  setupWriteFailure: (params: {
    questFolderPath: FilePath;
    wardResultId: WardResult['id'];
    error: Error;
  }) => void;
  getWrittenContent: (params: { questFolderPath: FilePath; wardResultId: WardResult['id'] }) => unknown;
  getWrittenPath: (params: { questFolderPath: FilePath; wardResultId: WardResult['id'] }) => unknown;
  getMkdirPaths: () => readonly unknown[];
} => {
  const joinHandle: MockHandle = registerMock({ fn: join });
  const ensureDirHandle = ensureDirProxy();
  const writeHandle = writeFileProxy();

  const stageDirJoins = ({
    questFolderPath,
    wardResultId,
  }: {
    questFolderPath: FilePath;
    wardResultId: WardResult['id'];
  }): void => {
    const wardResultsDir = wardResultsDirFor({ questFolderPath });
    joinHandle
      .calledWith([questFolderPath, locationsStatics.quest.wardResultsDir])
      .returns(wardResultsDir);
    ensureDirHandle.succeeds({ path: wardResultsDir });
    joinHandle
      .calledWith([wardResultsDir, wardResultId + JSON_EXTENSION])
      .returns(resultFilePathFor({ questFolderPath, wardResultId }));
  };

  return {
    setupSuccess: ({
      questFolderPath,
      wardResultId,
    }: {
      questFolderPath: FilePath;
      wardResultId: WardResult['id'];
    }): void => {
      stageDirJoins({ questFolderPath, wardResultId });
      writeHandle.succeeds({ path: resultFilePathFor({ questFolderPath, wardResultId }) });
    },

    setupWriteFailure: ({
      questFolderPath,
      wardResultId,
      error,
    }: {
      questFolderPath: FilePath;
      wardResultId: WardResult['id'];
      error: Error;
    }): void => {
      stageDirJoins({ questFolderPath, wardResultId });
      writeHandle.rejects({
        path: resultFilePathFor({ questFolderPath, wardResultId }),
        error: Object.assign(error, { code: 'EIO' }),
      });
    },

    getWrittenContent: ({
      questFolderPath,
      wardResultId,
    }: {
      questFolderPath: FilePath;
      wardResultId: WardResult['id'];
    }): unknown =>
      writeHandle.writtenContentsFor({
        path: resultFilePathFor({ questFolderPath, wardResultId }),
      }),

    getWrittenPath: ({
      questFolderPath,
      wardResultId,
    }: {
      questFolderPath: FilePath;
      wardResultId: WardResult['id'];
    }): unknown => resultFilePathFor({ questFolderPath, wardResultId }),

    getMkdirPaths: (): readonly unknown[] =>
      ensureDirHandle.getCallsFor({ path: () => true }).map((call) => call[0]),
  };
};
