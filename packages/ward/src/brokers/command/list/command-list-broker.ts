/**
 * PURPOSE: Loads a ward run result and writes an errors-by-file list to stdout
 *
 * USAGE:
 * await commandListBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Writes error list to stdout, or error message if no result found
 */

import { stderr, stdout } from '#gateway/node/process';

import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { resultToListTransformer } from '../../../transformers/result-to-list/result-to-list-transformer';
import type { WardRunResult } from '../../../contracts/ward-run-result/ward-run-result-contract';

export const commandListBroker = async ({
  rootPath,
  runId,
}: {
  rootPath: string;
  runId?: WardRunResult['runId'];
}): Promise<void> => {
  const loadArgs = runId ? { rootPath, runId } : { rootPath };
  const wardResult = await storageLoadBroker(loadArgs);

  if (!wardResult) {
    stderr.write('No ward results found\n');
    return;
  }

  const list = resultToListTransformer({ wardResult });

  stdout.write(`${list}\n`);
};
