import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

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
  wardResultId: string;
}): FilePath =>
  filePathContract.parse(
    `${questFolderPath}/${locationsStatics.quest.wardResultsDir}/${wardResultId}${JSON_EXTENSION}`,
  );

export const wardPersistResultBrokerProxy = (): {
  setupSuccess: (params: { questFolderPath: FilePath; wardResultId: string }) => void;
  setupWriteFailure: (params: {
    questFolderPath: FilePath;
    wardResultId: string;
    error: Error;
  }) => void;
  getWrittenContent: (params: { questFolderPath: FilePath; wardResultId: string }) => unknown;
  getWrittenPath: (params: { questFolderPath: FilePath; wardResultId: string }) => unknown;
  getMkdirPaths: () => readonly unknown[];
} => {
  const joinHandle: MockHandle = registerMock({ fn: join });
  const ensureDirHandle = ensureDirProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  const stageDirJoins = ({
    questFolderPath,
    wardResultId,
  }: {
    questFolderPath: FilePath;
    wardResultId: string;
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
      wardResultId: string;
    }): void => {
      stageDirJoins({ questFolderPath, wardResultId });
      writeProxy.succeeds({ filePath: resultFilePathFor({ questFolderPath, wardResultId }) });
    },

    setupWriteFailure: ({
      questFolderPath,
      wardResultId,
      error,
    }: {
      questFolderPath: FilePath;
      wardResultId: string;
      error: Error;
    }): void => {
      stageDirJoins({ questFolderPath, wardResultId });
      writeProxy.throws({
        filePath: resultFilePathFor({ questFolderPath, wardResultId }),
        error,
      });
    },

    getWrittenContent: ({
      questFolderPath,
      wardResultId,
    }: {
      questFolderPath: FilePath;
      wardResultId: string;
    }): unknown =>
      writeProxy.getWrittenFor({ filePath: resultFilePathFor({ questFolderPath, wardResultId }) }),

    getWrittenPath: ({
      questFolderPath,
      wardResultId,
    }: {
      questFolderPath: FilePath;
      wardResultId: string;
    }): unknown => resultFilePathFor({ questFolderPath, wardResultId }),

    getMkdirPaths: (): readonly unknown[] =>
      ensureDirHandle.getCallsFor({ path: () => true }).map((call) => call[0]),
  };
};
