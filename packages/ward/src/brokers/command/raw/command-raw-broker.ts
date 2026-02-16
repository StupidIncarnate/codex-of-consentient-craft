/**
 * PURPOSE: Loads a ward run result and writes raw stdout/stderr for a specific check type to stdout
 *
 * USAGE:
 * await commandRawBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), runId: RunIdStub(), checkType: CheckTypeStub() });
 * // Writes raw process output to stdout
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';

export const commandRawBroker = async ({
  rootPath,
  runId,
  checkType,
}: {
  rootPath: AbsoluteFilePath;
  runId: RunId;
  checkType: CheckType;
}): Promise<void> => {
  const wardResult = await storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    process.stderr.write(`No ward result found for run ${runId}\n`);
    return;
  }

  const matchingCheck = wardResult.checks.find((check) => check.checkType === checkType);

  if (!matchingCheck) {
    process.stderr.write(`No ${checkType} check found in run ${runId}\n`);
    return;
  }

  for (const project of matchingCheck.projectResults) {
    if (String(project.rawOutput.stdout)) {
      process.stdout.write(`${project.rawOutput.stdout}\n`);
    }
    if (String(project.rawOutput.stderr)) {
      process.stdout.write(`${project.rawOutput.stderr}\n`);
    }
  }
};
