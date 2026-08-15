import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, RiftcarverResult } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

const LOG_EXTENSION = '.log';

// riftcarverPersistResultBroker joins questFolderPath + riftcarverResultsDir +
// `${riftcarverResultId}.log` through pathJoinAdapter, which (unmocked here) falls through to a
// real '/'-joined path — so this proxy replicates the same join to key the write mock on the real
// resulting address.
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
  const mkdirProxy = fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: ({ questFolderPath, riftcarverResultId }): void => {
      writeProxy.succeeds({ filePath: logFilePathFor({ questFolderPath, riftcarverResultId }) });
    },

    setupWriteFailure: ({ questFolderPath, riftcarverResultId, error }): void => {
      writeProxy.throws({
        filePath: logFilePathFor({ questFolderPath, riftcarverResultId }),
        error,
      });
    },

    getWrittenContent: ({ questFolderPath, riftcarverResultId }): unknown =>
      writeProxy.getWrittenFor({
        filePath: logFilePathFor({ questFolderPath, riftcarverResultId }),
      }),

    getWrittenPath: ({ questFolderPath, riftcarverResultId }): unknown =>
      logFilePathFor({ questFolderPath, riftcarverResultId }),

    getMkdirPaths: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
