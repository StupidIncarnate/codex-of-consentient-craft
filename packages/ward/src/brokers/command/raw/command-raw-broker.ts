/**
 * PURPOSE: Loads a ward run result and writes raw stdout/stderr for a specific check type to stdout
 *
 * USAGE:
 * await commandRawBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), runId: RunIdStub(), checkType: CheckTypeStub() });
 * // Writes raw process output to stdout
 */

import { stderr, stdout } from '#gateway/node/process';

import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import type { WardRunResult } from '../../../contracts/ward-result/ward-result-contract';

export const commandRawBroker = async ({
  rootPath,
  runId,
  checkType,
}: {
  rootPath: string;
  runId: WardRunResult['runId'];
  checkType: CheckType;
}): Promise<void> => {
  const wardResult = await storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    stderr.write(`No ward result found for run ${runId}\n`);
    return;
  }

  const matchingCheck = wardResult.checks.find((check) => check.checkType === checkType);

  if (!matchingCheck) {
    stderr.write(`No ${checkType} check found in run ${runId}\n`);
    return;
  }

  for (const project of matchingCheck.projectResults) {
    if (String(project.rawOutput.stdout)) {
      stdout.write(`${project.rawOutput.stdout}\n`);
    }
    if (String(project.rawOutput.stderr)) {
      stdout.write(`${project.rawOutput.stderr}\n`);
    }
  }
};
