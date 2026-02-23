/**
 * PURPOSE: Adapter that loads ward results and formats detailed errors for a specific file
 *
 * USAGE:
 * const result = await wardDetailAdapter({ runId: RunIdStub(), filePath: 'src/app.ts' });
 * // Returns: ContentText with detailed errors for the specified file
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { RunId } from '@dungeonmaster/ward/dist/contracts/run-id/run-id-contract';
import * as WardStorage from '@dungeonmaster/ward/dist/brokers/storage/load/storage-load-broker';
import * as WardDetailTransformer from '@dungeonmaster/ward/dist/transformers/result-to-detail/result-to-detail-transformer';

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const wardDetailAdapter = async ({
  runId,
  filePath,
  verbose,
  packagePath,
}: {
  runId?: RunId;
  filePath: ContentText;
  verbose?: boolean;
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

  const detail = WardDetailTransformer.resultToDetailTransformer({
    wardResult,
    filePath: String(filePath) as never,
    verbose: verbose ?? false,
  });

  return contentTextContract.parse(String(detail));
};
