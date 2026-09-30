/**
 * PURPOSE: Proxy for plannedWorkReadBroker — mocks the shared planned-work directory resolver's
 * underlying path.join call and the file read, each keyed on the real
 * computed address so a mock only answers for the path the broker actually builds. `join` is
 * mocked directly on the `#gateway/node/path` specifier (no per-function wrapper to compose),
 * addressed by the EXACT [dirPath, fileName] tuple: a shorter stage would prefix-match a longer
 * real call and answer it wrong.
 */

import type { AbsoluteFilePath, OperationItem } from '@dungeonmaster/shared/contracts';
import { locationsPlannedWorkPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/planned-work-path-find/locations-planned-work-path-find-broker.proxy';
import type { FsError } from '#gateway/node/fs';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';

type WorkPlan = ReturnType<typeof WorkPlanStub>;

const JSON_EXTENSION = '.json';
const PLANNED_WORK_DIR = 'planned-work';

const dirPathFor = ({ questFolderPath }: { questFolderPath: AbsoluteFilePath }): string =>
  `${questFolderPath}/${PLANNED_WORK_DIR}`;

const filePathFor = ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItem['id'];
}): string =>
  `${dirPathFor({ questFolderPath })}/${String(operationItemId)}${JSON_EXTENSION}`;

export const plannedWorkReadBrokerProxy = (): {
  setupPlanFound: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
    plan: WorkPlan;
  }) => void;
  setupPlanMissing: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
  }) => void;
  setupReadFailure: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
    error: FsError;
  }) => void;
} => {
  const locationsProxy = locationsPlannedWorkPathFindBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const readFileHandle = readFileIfExistsProxy();

  const stagePaths = ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItem['id'];
  }): string => {
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
      readFileHandle.returns({ path: filePath, contents: JSON.stringify(plan) });
    },

    setupPlanMissing: ({ questFolderPath, operationItemId }): void => {
      const filePath = stagePaths({ questFolderPath, operationItemId });
      readFileHandle.missing({ path: filePath });
    },

    setupReadFailure: ({ questFolderPath, operationItemId, error }): void => {
      const filePath = stagePaths({ questFolderPath, operationItemId });
      readFileHandle.throwsMatchingPath({ path: filePath, error });
    },
  };
};
