/**
 * PURPOSE: Writes a WardResult as JSON to .ward/run-<id>.json in the project root
 *
 * USAGE:
 * await storageSaveBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), wardResult: WardResultStub() });
 * // Creates .ward/run-1739625600000-a3f1.json with serialized WardResult
 */

import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import {
  fileContentsContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../../contracts/ward-result/ward-result-contract';

export const storageSaveBroker = async ({
  rootPath,
  wardResult,
}: {
  rootPath: AbsoluteFilePath;
  wardResult: WardResult;
}): Promise<void> => {
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);
  await ensureDir(wardDir);

  const filePath = filePathContract.parse(`${rootPath}/.ward/run-${wardResult.runId}.json`);
  const contents = fileContentsContract.parse(JSON.stringify(wardResult));

  await writeFile(filePath, contents);
};
