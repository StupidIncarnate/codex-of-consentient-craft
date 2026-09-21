/**
 * PURPOSE: Writes one operation item's planned work to <questFolder>/planned-work/<id>.json,
 * atomically — tmp-write then rename, the same shape questPersistBroker uses, since
 * fsRenameAdapter is POSIX-atomic on the same filesystem. Creates the planned-work/ directory
 * first: unlike quest.json, it does not exist until the first plan is written into it, and this
 * package carries no mkdir adapter of its own — fsMkdirAdapter (@dungeonmaster/shared/adapters)
 * is always recursive, so a second write against an already-created directory does not throw.
 * Appends nothing to the quest outbox: a plan file is not quest.json, so this write is not a
 * quest mutation in that sense — see this story's OPEN note on notifying the browser.
 *
 * USAGE:
 * await plannedWorkWriteBroker({ questFolderPath: AbsoluteFilePathStub(), operationItemId: OperationItemIdStub(), plan: WorkPlanStub() });
 * // Writes <questFolderPath>/planned-work/<operationItemId>.json and returns { success: true }
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsPlannedWorkPathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  adapterResultContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  AdapterResult,
  OperationItemId,
} from '@dungeonmaster/shared/contracts';

import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
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
  operationItemId: OperationItemId;
  plan: WorkPlan;
}): Promise<AdapterResult> => {
  const dirPath = locationsPlannedWorkPathFindBroker({ questFolderPath });
  // Re-parsed to FilePath: fsMkdirAdapter's own brand is distinct from AbsoluteFilePath's, so the
  // resolver's return needs re-validating through the same contract every other caller here uses
  // (see quest-create-broker.ts's identical re-parse before its own fsMkdirAdapter calls).
  await fsMkdirAdapter({ filepath: filePathContract.parse(dirPath) });

  const filePath = filePathContract.parse(
    pathJoinAdapter({ paths: [dirPath, `${String(operationItemId)}${JSON_EXTENSION}`] }),
  );
  const tmpPath = filePathContract.parse(`${filePath}${TMP_SUFFIX}`);

  await fsWriteFileAdapter({
    filePath: tmpPath,
    contents: fileContentsContract.parse(JSON.stringify(plan, null, JSON_INDENT_SPACES)),
  });
  await fsRenameAdapter({ from: tmpPath, to: filePath });

  return adapterResultContract.parse({ success: true });
};
