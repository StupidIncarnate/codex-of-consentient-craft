/**
 * PURPOSE: Writes one operation item's planned work to <questFolder>/planned-work/<id>.json,
 * atomically — tmp-write then rename, the same shape questPersistBroker uses, since
 * `rename` is POSIX-atomic on the same filesystem. Creates the planned-work/ directory
 * first: unlike quest.json, it does not exist until the first plan is written into it.
 * `ensureDir` (`#gateway/node/fs__promises`) is always recursive, so a second write against an
 * already-created directory does not throw. Appends nothing to the quest outbox: a plan file is
 * not quest.json, so this write is not a quest mutation in that sense — see this story's OPEN
 * note on notifying the browser.
 *
 * USAGE:
 * await plannedWorkWriteBroker({ questFolderPath: AbsoluteFilePathStub(), operationItemId: OperationItemIdStub(), plan: WorkPlanStub() });
 * // Writes <questFolderPath>/planned-work/<operationItemId>.json and returns { success: true }
 */

import { locationsPlannedWorkPathFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, OperationItem } from '@dungeonmaster/shared/contracts';
import { ensureDir, rename, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import type { WorkPlan } from '../../../contracts/work-plan/work-plan-contract';

const JSON_EXTENSION = '.json';
const TMP_SUFFIX = '.tmp';
const JSON_INDENT_SPACES = 2;

export const plannedWorkWriteBroker = async ({
  questFolderPath,
  operationItemId,
  plan,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItem['id'];
  plan: WorkPlan;
}): Promise<void> => {
  const dirPath = locationsPlannedWorkPathFindBroker({ questFolderPath });
  await ensureDir(dirPath);

  const filePath = filePathContract.parse(
    join(dirPath, `${String(operationItemId)}${JSON_EXTENSION}`),
  );
  const tmpPath = filePathContract.parse(`${filePath}${TMP_SUFFIX}`);

  await writeFile(tmpPath, JSON.stringify(plan, null, JSON_INDENT_SPACES));
  await rename(tmpPath, filePath);
};
