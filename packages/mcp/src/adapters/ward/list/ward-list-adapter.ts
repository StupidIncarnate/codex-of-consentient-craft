/**
 * PURPOSE: Adapter that loads ward results and formats them as an errors-by-file list
 *
 * USAGE:
 * const result = await wardListAdapter({});
 * // Returns: ContentText with formatted errors-by-file string or message if no results found
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { RunId } from '@dungeonmaster/ward/dist/contracts/run-id/run-id-contract';
import * as WardStorage from '@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker';
import * as WardListTransformer from '@dungeonmaster/ward/dist/transformers/result-to-list/result-to-list-transformer';

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const wardListAdapter = async ({
  runId,
  packagePath,
}: {
  runId?: RunId;
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

  const list = WardListTransformer.resultToListTransformer({ wardResult });

  return contentTextContract.parse(String(list) || 'No errors found');
};
