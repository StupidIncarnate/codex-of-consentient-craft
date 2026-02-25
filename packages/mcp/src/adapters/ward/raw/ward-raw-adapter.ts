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
  packagePath,
}: {
  runId?: RunId;
  checkType: CheckType;
  packagePath?: string;
}): Promise<ContentText> => {
  const rootPath = packagePath
    ? absoluteFilePathContract.parse(`${process.cwd()}/${packagePath}`)
    : absoluteFilePathContract.parse(process.cwd());
  const loadArgs = runId ? { rootPath, runId } : { rootPath };
  const wardResult = await WardStorage.storageLoadBroker(loadArgs);

  if (!wardResult) {
    const message = runId ? `No ward result found for run ${runId}` : 'No ward results found';
    return contentTextContract.parse(message);
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
