/**
 * PURPOSE: Loads a ward run result and writes detailed errors for a specific file to stdout
 *
 * USAGE:
 * await commandDetailBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), runId: RunIdStub(), filePath: 'src/index.ts' });
 * // Writes file detail to stdout
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import type { ErrorEntry } from '../../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../../contracts/test-failure/test-failure-contract';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { resultToDetailTransformer } from '../../../transformers/result-to-detail/result-to-detail-transformer';

export const commandDetailBroker = async ({
  rootPath,
  runId,
  filePath,
  verbose,
}: {
  rootPath: AbsoluteFilePath;
  runId: RunId;
  filePath: ErrorEntry['filePath'] | TestFailure['suitePath'];
  verbose?: boolean;
}): Promise<void> => {
  const wardResult = await storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    process.stderr.write(`No ward result found for run ${runId}\n`);
    return;
  }

  const detailArgs = verbose ? { wardResult, filePath, verbose } : { wardResult, filePath };
  const detail = resultToDetailTransformer(detailArgs);

  process.stdout.write(`${detail}\n`);
};
