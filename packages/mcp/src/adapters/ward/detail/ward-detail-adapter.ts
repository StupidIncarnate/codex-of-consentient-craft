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
}: {
  runId: RunId;
  filePath: ContentText;
  verbose?: boolean;
}): Promise<ContentText> => {
  const rootPath = absoluteFilePathContract.parse(process.cwd());
  const wardResult = await WardStorage.storageLoadBroker({ rootPath, runId });

  if (!wardResult) {
    return contentTextContract.parse(`No ward result found for run ${runId}`);
  }

  const detail = WardDetailTransformer.resultToDetailTransformer({
    wardResult,
    filePath: String(filePath) as never,
    verbose: verbose ?? false,
  });

  return contentTextContract.parse(String(detail));
};
