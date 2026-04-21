/**
 * PURPOSE: Writes a WardResult as JSON to .ward/run-<id>.json in the project root
 *
 * USAGE:
 * await storageSaveBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), wardResult: WardResultStub() });
 * // Creates .ward/run-1739625600000-a3f1.json with serialized WardResult
 */

import {
  adapterResultContract,
  fileContentsContract,
  filePathContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../../contracts/ward-result/ward-result-contract';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

export const storageSaveBroker = async ({
  rootPath,
  wardResult,
}: {
  rootPath: AbsoluteFilePath;
  wardResult: WardResult;
}): Promise<AdapterResult> => {
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);
  await fsMkdirAdapter({ dirPath: wardDir });

  const filePath = filePathContract.parse(`${rootPath}/.ward/run-${wardResult.runId}.json`);
  const contents = fileContentsContract.parse(JSON.stringify(wardResult));

  await fsWriteFileAdapter({ filePath, contents });
  return adapterResultContract.parse({ success: true });
};
