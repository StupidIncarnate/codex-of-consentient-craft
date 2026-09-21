/**
 * PURPOSE: Reads one operation item's planned work off disk, or returns null when no planner has
 * run against it yet — a scope with no plan file legitimately has none, never a throw and never
 * `{}`. Existence is checked with fsIsAccessibleAdapter FIRST because this package's
 * fsReadFileAdapter rewraps EVERY failure (ENOENT included) into the same generic Error, leaving
 * no shape left to distinguish "file absent" from "disk failure" once it has thrown.
 *
 * USAGE:
 * await plannedWorkReadBroker({ questFolderPath: AbsoluteFilePathStub(), operationItemId: OperationItemIdStub() });
 * // Returns WorkPlan, or null when no plan has been written for this operation item yet
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsPlannedWorkPathFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, OperationItemId } from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { workPlanContract } from '../../../contracts/work-plan/work-plan-contract';
import type { WorkPlan } from '../../../contracts/work-plan/work-plan-contract';

const JSON_EXTENSION = '.json';

export const plannedWorkReadBroker = async ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItemId;
}): Promise<WorkPlan | null> => {
  const dirPath = locationsPlannedWorkPathFindBroker({ questFolderPath });
  const filePath = filePathContract.parse(
    pathJoinAdapter({ paths: [dirPath, `${String(operationItemId)}${JSON_EXTENSION}`] }),
  );

  if (!(await fsIsAccessibleAdapter({ filePath }))) {
    return null;
  }

  const contents = await fsReadFileAdapter({ filePath });
  return workPlanContract.parse(JSON.parse(String(contents)));
};
