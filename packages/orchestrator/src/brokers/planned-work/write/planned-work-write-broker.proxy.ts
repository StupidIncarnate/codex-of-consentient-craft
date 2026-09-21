/**
 * PURPOSE: Proxy for plannedWorkWriteBroker — mocks the shared planned-work directory resolver,
 * the directory create, and the tmp-write-then-rename atomic write, each keyed on the real
 * computed address so a mock only answers for the path the broker actually builds.
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, OperationItemId } from '@dungeonmaster/shared/contracts';
import {
  fsMkdirAdapterProxy,
  locationsPlannedWorkPathFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

const JSON_EXTENSION = '.json';
const TMP_SUFFIX = '.tmp';
const PLANNED_WORK_DIR = 'planned-work';

const dirPathFor = ({ questFolderPath }: { questFolderPath: AbsoluteFilePath }): FilePath =>
  filePathContract.parse(`${questFolderPath}/${PLANNED_WORK_DIR}`);

const filePathFor = ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItemId;
}): FilePath =>
  filePathContract.parse(
    `${dirPathFor({ questFolderPath })}/${String(operationItemId)}${JSON_EXTENSION}`,
  );

export const plannedWorkWriteBrokerProxy = (): {
  setupWriteSucceeds: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => void;
  setupMkdirFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
    error: Error;
  }) => void;
  setupWriteFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
    error: Error;
  }) => void;
  setupRenameFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
    error: Error;
  }) => void;
  getWrittenContent: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => unknown;
  getAllRenames: () => readonly { from: unknown; to: unknown }[];
} => {
  const locationsProxy = locationsPlannedWorkPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  const stagePaths = ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }): { dirPath: FilePath; tmpPath: FilePath } => {
    const dirPath = dirPathFor({ questFolderPath });
    locationsProxy.setupPlannedWorkPath({ plannedWorkPath: dirPath });
    const filePath = filePathFor({ questFolderPath, operationItemId });
    pathJoinProxy.returns({ result: filePath });
    const tmpPath = filePathContract.parse(`${filePath}${TMP_SUFFIX}`);
    return { dirPath, tmpPath };
  };

  return {
    setupWriteSucceeds: ({ questFolderPath, operationItemId }): void => {
      const { dirPath, tmpPath } = stagePaths({ questFolderPath, operationItemId });
      mkdirProxy.succeeds({ filepath: dirPath });
      writeProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
    },

    setupMkdirFailure: ({ questFolderPath, operationItemId, error }): void => {
      const { dirPath } = stagePaths({ questFolderPath, operationItemId });
      mkdirProxy.throws({ filepath: dirPath, error });
    },

    setupWriteFailure: ({ questFolderPath, operationItemId, error }): void => {
      const { dirPath, tmpPath } = stagePaths({ questFolderPath, operationItemId });
      mkdirProxy.succeeds({ filepath: dirPath });
      writeProxy.throws({ filePath: tmpPath, error });
    },

    setupRenameFailure: ({ questFolderPath, operationItemId, error }): void => {
      const { dirPath, tmpPath } = stagePaths({ questFolderPath, operationItemId });
      mkdirProxy.succeeds({ filepath: dirPath });
      writeProxy.succeeds({ filePath: tmpPath });
      renameProxy.throws({ from: tmpPath, error });
    },

    getWrittenContent: ({ questFolderPath, operationItemId }): unknown => {
      const filePath = filePathFor({ questFolderPath, operationItemId });
      const tmpPath = filePathContract.parse(`${filePath}${TMP_SUFFIX}`);
      return writeProxy.getWrittenFor({ filePath: tmpPath });
    },

    getAllRenames: (): readonly { from: unknown; to: unknown }[] => renameProxy.getAllRenames(),
  };
};
