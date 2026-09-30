/**
 * PURPOSE: Proxy for plannedWorkWriteBroker — mocks the shared planned-work directory resolver,
 * the directory create (`ensureDir`, addressed by the exact path), and the tmp-write-then-rename
 * atomic write, each keyed on the real computed address so a mock only answers for the path the
 * broker actually builds. `join` is mocked directly on the `#gateway/node/path` specifier (no
 * per-function wrapper to compose), addressed by the EXACT [dirPath, fileName] tuple.
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, OperationItem } from '@dungeonmaster/shared/contracts';
import { locationsPlannedWorkPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/planned-work-path-find/locations-planned-work-path-find-broker.proxy';
import type { FsError } from '#gateway/node/fs';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  operationItemId: OperationItem['id'];
}): FilePath =>
  filePathContract.parse(
    `${dirPathFor({ questFolderPath })}/${String(operationItemId)}${JSON_EXTENSION}`,
  );

export const plannedWorkWriteBrokerProxy = (): {
  setupWriteSucceeds: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
  }) => void;
  setupMkdirFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
    error: FsError;
  }) => void;
  setupWriteFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
    error: Error;
  }) => void;
  setupRenameFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
    error: Error;
  }) => void;
  getWrittenContent: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
  }) => unknown;
  getAllRenames: () => readonly { from: unknown; to: unknown }[];
} => {
  const locationsProxy = locationsPlannedWorkPathFindBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const ensureDirHandle = ensureDirProxy();
  const writeHandle = writeFileProxy();
  const renameHandle = renameProxy();
  // Every rename this proxy staged, so `getAllRenames` reads back exactly the addresses a test set up.
  const stagedRenames: { from: FilePath; to: FilePath }[] = [];

  const stagePaths = ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
  }): { dirPath: FilePath; tmpPath: FilePath; filePath: FilePath } => {
    const dirPath = dirPathFor({ questFolderPath });
    locationsProxy.setupPlannedWorkPath({ plannedWorkPath: dirPath });
    const filePath = filePathFor({ questFolderPath, operationItemId });
    joinHandle
      .calledWith([dirPath, `${String(operationItemId)}${JSON_EXTENSION}`])
      .returns(filePath);
    const tmpPath = filePathContract.parse(`${filePath}${TMP_SUFFIX}`);
    return { dirPath, tmpPath, filePath };
  };

  return {
    setupWriteSucceeds: ({ questFolderPath, operationItemId }): void => {
      const { dirPath, tmpPath, filePath } = stagePaths({ questFolderPath, operationItemId });
      ensureDirHandle.succeeds({ path: dirPath });
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.succeeds({ from: tmpPath, to: filePath });
      if (!stagedRenames.some((staged) => staged.from === tmpPath)) {
        stagedRenames.push({ from: tmpPath, to: filePath });
      }
    },

    setupMkdirFailure: ({ questFolderPath, operationItemId, error }): void => {
      const { dirPath } = stagePaths({ questFolderPath, operationItemId });
      ensureDirHandle.rejects({ path: dirPath, error });
    },

    setupWriteFailure: ({ questFolderPath, operationItemId, error }): void => {
      const { dirPath, tmpPath } = stagePaths({ questFolderPath, operationItemId });
      ensureDirHandle.succeeds({ path: dirPath });
      writeHandle.rejects({ path: tmpPath, error: Object.assign(error, { code: 'EIO' }) });
    },

    setupRenameFailure: ({ questFolderPath, operationItemId, error }): void => {
      const { dirPath, tmpPath, filePath } = stagePaths({ questFolderPath, operationItemId });
      ensureDirHandle.succeeds({ path: dirPath });
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.rejects({
        from: tmpPath,
        to: filePath,
        error: Object.assign(error, { code: 'EIO' }),
      });
      if (!stagedRenames.some((staged) => staged.from === tmpPath)) {
        stagedRenames.push({ from: tmpPath, to: filePath });
      }
    },

    getWrittenContent: ({ questFolderPath, operationItemId }): unknown => {
      const filePath = filePathFor({ questFolderPath, operationItemId });
      const tmpPath = filePathContract.parse(`${filePath}${TMP_SUFFIX}`);
      return writeHandle.writtenContentsFor({ path: tmpPath });
    },

    getAllRenames: (): readonly { from: unknown; to: unknown }[] =>
      stagedRenames.flatMap(({ from, to }) =>
        renameHandle.getCallsFor({ from, to }).map((call) => ({ from: call[0], to: call[1] })),
      ),
  };
};
