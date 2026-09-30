/**
 * PURPOSE: Writes a WardResult as JSON to .ward/run-<id>.json in the project root
 *
 * USAGE:
 * await storageSaveBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), wardResult: WardResultStub() });
 * // Creates .ward/run-1739625600000-a3f1.json with serialized WardResult
 */

import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { fileContentsContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { WardRunResult } from '../../../contracts/ward-result/ward-result-contract';

export const storageSaveBroker = async ({
  rootPath,
  wardResult,
}: {
  rootPath: AbsoluteFilePath;
  wardResult: WardRunResult;
}): Promise<void> => {
  const wardDir = `${rootPath}/.ward`;
  await ensureDir(wardDir);

  const filePath = `${rootPath}/.ward/run-${wardResult.runId}.json`;
  const contents = fileContentsContract.parse(JSON.stringify(wardResult));

  await writeFile(filePath, contents);
};
