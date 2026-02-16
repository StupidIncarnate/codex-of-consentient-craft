/**
 * PURPOSE: Loads a ward run result and writes an errors-by-file list to stdout
 *
 * USAGE:
 * await commandListBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Writes error list to stdout, or error message if no result found
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { resultToListTransformer } from '../../../transformers/result-to-list/result-to-list-transformer';

export const commandListBroker = async ({
  rootPath,
  runId,
}: {
  rootPath: AbsoluteFilePath;
  runId?: RunId;
}): Promise<void> => {
  const loadArgs = runId ? { rootPath, runId } : { rootPath };
  const wardResult = await storageLoadBroker(loadArgs);

  if (!wardResult) {
    process.stderr.write('No ward results found\n');
    return;
  }

  const list = resultToListTransformer({ wardResult });

  process.stdout.write(`${list}\n`);
};
