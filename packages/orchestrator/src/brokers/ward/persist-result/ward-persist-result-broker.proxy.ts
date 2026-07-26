import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

const JSON_EXTENSION = '.json';

// wardPersistResultBroker joins questFolderPath + wardResultsDir + `${wardResultId}.json` via
// pathJoinAdapter, which (unmocked here) falls through to a real '/'-joined path — so this
// proxy replicates that same join to key the write mock on the real, resulting address.
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
} => {
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: ({
      questFolderPath,
      wardResultId,
    }: {
      questFolderPath: FilePath;
      wardResultId: string;
    }): void => {
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
  };
};
