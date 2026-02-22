/**
 * PURPOSE: Adapter that loads ward results and extracts raw stdout/stderr for a specific check type
 *
 * USAGE:
 * const result = await wardRawAdapter({ runId: RunIdStub(), checkType: 'lint' });
 * // Returns: ContentText with raw process output for the specified check type
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { RunId } from '@dungeonmaster/ward/dist/contracts/run-id/run-id-contract';
import type { CheckType } from '@dungeonmaster/ward/dist/contracts/check-type/check-type-contract';
import * as WardStorage from '@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker';

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const wardRawAdapter = async ({
  runId,
  checkType,
}: {
  runId: RunId;
  checkType: CheckType;
}): Promise<ContentText> => {
  const rootPath = absoluteFilePathContract.parse(process.cwd());
  const wardResult = await WardStorage.storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    return contentTextContract.parse(`No ward result found for run ${runId}`);
  }

  const matchingCheck = wardResult.checks.find((check) => check.checkType === checkType);

  if (!matchingCheck) {
    return contentTextContract.parse(`No ${checkType} check found in run ${runId}`);
  }

  const outputParts: ContentText[] = [];

  for (const project of matchingCheck.projectResults) {
    if (String(project.rawOutput.stdout)) {
      outputParts.push(contentTextContract.parse(project.rawOutput.stdout));
    }
    if (String(project.rawOutput.stderr)) {
      outputParts.push(contentTextContract.parse(project.rawOutput.stderr));
    }
  }

  return contentTextContract.parse(
    outputParts.length > 0 ? outputParts.join('\n') : 'No raw output available',
  );
};
