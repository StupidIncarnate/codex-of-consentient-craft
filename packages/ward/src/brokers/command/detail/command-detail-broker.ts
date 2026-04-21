/**
 * PURPOSE: Loads a ward run result and writes detailed errors to stdout (text or JSON format)
 *
 * USAGE:
 * await commandDetailBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), runId: RunIdStub(), filePath: 'src/index.ts' });
 * // Writes file detail to stdout
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import type { ErrorEntry } from '../../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../../contracts/test-failure/test-failure-contract';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { resultToDetailTransformer } from '../../../transformers/result-to-detail/result-to-detail-transformer';
import { resultToDetailJsonTransformer } from '../../../transformers/result-to-detail-json/result-to-detail-json-transformer';

export const commandDetailBroker = async ({
  rootPath,
  runId,
  filePath,
  json,
}: {
  rootPath: AbsoluteFilePath;
  runId: RunId;
  filePath?: ErrorEntry['filePath'] | TestFailure['suitePath'];
  json?: boolean;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const wardResult = await storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    process.stderr.write(`No ward result found for run ${runId}\n`);
    return result;
  }

  if (json) {
    const detail = resultToDetailJsonTransformer({ wardResult });
    process.stdout.write(`${detail}\n`);
    return result;
  }

  const detail = filePath
    ? resultToDetailTransformer({ wardResult, filePath })
    : resultToDetailTransformer({ wardResult });

  process.stdout.write(`${detail}\n`);
  return result;
};
