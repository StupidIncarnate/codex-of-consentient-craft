/**
 * PURPOSE: Proxy for plannedWorkReadBroker — mocks the shared planned-work directory resolver's
 * underlying path.join call, the existence check, and the file read, each keyed on the real
 * computed address so a mock only answers for the path the broker actually builds.
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, OperationItemId } from '@dungeonmaster/shared/contracts';
import {
  locationsPlannedWorkPathFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';

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
  const pathJoinProxy = pathJoinAdapterProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const stagePaths = ({
    questFolderPath,
    operationItemId,
  }: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }): FilePath => {
    locationsProxy.setupPlannedWorkPath({ plannedWorkPath: dirPathFor({ questFolderPath }) });
    const filePath = filePathFor({ questFolderPath, operationItemId });
    pathJoinProxy.returns({ result: filePath });
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
