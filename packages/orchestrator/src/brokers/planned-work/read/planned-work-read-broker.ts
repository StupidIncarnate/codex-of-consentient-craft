/**
 * PURPOSE: Reads one operation item's planned work off disk, or returns null when no planner has
 * run against it yet — a scope with no plan file legitimately has none, never a throw and never
 * `{}`. Only ENOENT reads as "no plan": readFileIfExists rejects on EACCES, EISDIR and the rest, so
 * a plan file that exists but cannot be read surfaces as the disk fault it is.
 *
 * USAGE:
 * await plannedWorkReadBroker({ questFolderPath: AbsoluteFilePathStub(), operationItemId: OperationItemIdStub() });
 * // Returns WorkPlan, or null when no plan has been written for this operation item yet
 */

import { locationsPlannedWorkPathFindBroker } from '@dungeonmaster/shared/brokers';
import type { OperationItem } from '@dungeonmaster/shared/contracts';
import { readFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { workPlanContract } from '../../../contracts/work-plan/work-plan-contract';
import type { WorkPlan } from '../../../contracts/work-plan/work-plan-contract';

const JSON_EXTENSION = '.json';

export const plannedWorkReadBroker = async ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: string;
  operationItemId: OperationItem['id'];
}): Promise<WorkPlan | null> => {
  const dirPath = locationsPlannedWorkPathFindBroker({ questFolderPath });
  const filePath = join(dirPath, `${String(operationItemId)}${JSON_EXTENSION}`);

  const contents = await readFileIfExists(filePath);
  if (contents === null) {
    return null;
  }

  return workPlanContract.parse(JSON.parse(contents));
};
