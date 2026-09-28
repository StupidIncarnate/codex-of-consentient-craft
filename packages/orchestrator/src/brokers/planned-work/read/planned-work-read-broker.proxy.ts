/**
 * PURPOSE: Proxy for plannedWorkReadBroker — mocks the shared planned-work directory resolver's
 * underlying path.join call, the existence check, and the file read, each keyed on the real
 * computed address so a mock only answers for the path the broker actually builds. `join` is
 * mocked directly on the `#gateway/node/path` specifier (no per-function wrapper to compose),
 * addressed by the EXACT [dirPath, fileName] tuple: a shorter stage would prefix-match a longer
 * real call and answer it wrong.
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, OperationItemId } from '@dungeonmaster/shared/contracts';
import { locationsPlannedWorkPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';

type WorkPlan = ReturnType<typeof WorkPlanStub>;

const JSON_EXTENSION = '.json';
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

export const plannedWorkReadBrokerProxy = (): {
  setupPlanFound: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
    plan: WorkPlan;
  }) => void;
  setupPlanMissing: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => void;
  setupReadFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
    error: Error;
  }) => void;
} => {
  const locationsProxy = locationsPlannedWorkPathFindBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const stagePaths = ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }): FilePath => {
    const dirPath = dirPathFor({ questFolderPath });
    locationsProxy.setupPlannedWorkPath({ plannedWorkPath: dirPath });
    const filePath = filePathFor({ questFolderPath, operationItemId });
    joinHandle
      .calledWith([dirPath, `${String(operationItemId)}${JSON_EXTENSION}`])
      .returns(filePath);
    return filePath;
  };

  return {
    setupPlanFound: ({ questFolderPath, operationItemId, plan }): void => {
      const filePath = stagePaths({ questFolderPath, operationItemId });
      isAccessibleProxy.resolves({ filePath });
      readFileProxy.resolves({ filePath, content: JSON.stringify(plan) });
    },

    setupPlanMissing: ({ questFolderPath, operationItemId }): void => {
      const filePath = stagePaths({ questFolderPath, operationItemId });
      isAccessibleProxy.rejects({
        filePath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupReadFailure: ({ questFolderPath, operationItemId, error }): void => {
      const filePath = stagePaths({ questFolderPath, operationItemId });
      isAccessibleProxy.resolves({ filePath });
      readFileProxy.rejects({ filePath, error });
    },
  };
};
