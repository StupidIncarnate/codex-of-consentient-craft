/**
 * PURPOSE: Loads a ward run result and writes detailed errors to stdout (text or JSON format)
 *
 * USAGE:
 * await commandDetailBroker({ rootPath: '/project', runId: RunIdStub(), filePath: 'src/index.ts' });
 * // Writes file detail to stdout
 */

import { stderr, stdout } from '#gateway/node/process';

import type { ErrorEntry } from '../../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../../contracts/test-failure/test-failure-contract';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { resultToDetailTransformer } from '../../../transformers/result-to-detail/result-to-detail-transformer';
import { resultToDetailJsonTransformer } from '../../../transformers/result-to-detail-json/result-to-detail-json-transformer';
import type { WardRunResult } from '../../../contracts/ward-run-result/ward-run-result-contract';

export const commandDetailBroker = async ({
  rootPath,
  runId,
  filePath,
  json,
}: {
  rootPath: string;
  runId: WardRunResult['runId'];
  filePath?: ErrorEntry['filePath'] | TestFailure['suitePath'];
  json?: boolean;
}): Promise<void> => {
  const wardResult = await storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    stderr.write(`No ward result found for run ${runId}\n`);
    return;
  }

  if (json) {
    const detail = resultToDetailJsonTransformer({ wardResult });
    stdout.write(`${detail}\n`);
    return;
  }

  const detail = filePath
    ? resultToDetailTransformer({ wardResult, filePath })
    : resultToDetailTransformer({ wardResult });

  stdout.write(`${detail}\n`);
};
