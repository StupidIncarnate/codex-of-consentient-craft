/**
 * PURPOSE: Reads a WardResult from .ward/run-<id>.json or finds the most recent run
 *
 * USAGE:
 * const result = await storageLoadBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns the most recent WardResult or null if none found
 */

import { readdirIfExists, readFile } from '#gateway/node/fs__promises';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  wardResultContract,
  type WardResult,
} from '../../../contracts/ward-result/ward-result-contract';

const RUN_FILE_PREFIX = 'run-';
const RUN_FILE_SUFFIX = '.json';

export const storageLoadBroker = async ({
  rootPath,
  runId,
}: {
  rootPath: AbsoluteFilePath;
  runId?: WardResult['runId'];
}): Promise<WardResult | null> => {
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);

  if (runId) {
    const filePath = filePathContract.parse(`${wardDir}/run-${runId}.json`);
    try {
      const contents = await readFile(filePath);
      return wardResultContract.parse(JSON.parse(contents));
    } catch {
      return null;
    }
  }

  try {
    const entries = await readdirIfExists(String(wardDir));
    if (entries === null) {
      return null;
    }
    // Only `run-<RunId>.json` files are real runs. Test harnesses that emulate ward write
    // arbitrarily-named run files into the same directory; those sort after the timestamped ones
    // and would otherwise shadow the newest real run.
    const runFiles = entries
      .filter((entry) => entry.startsWith(RUN_FILE_PREFIX) && entry.endsWith(RUN_FILE_SUFFIX))
      .filter(
        (entry) =>
          wardResultContract.shape.runId.safeParse(entry.slice(RUN_FILE_PREFIX.length, -RUN_FILE_SUFFIX.length))
            .success,
      )
      .sort();

    if (runFiles.length === 0) {
      return null;
    }

    const latestFile = runFiles[runFiles.length - 1];
    const filePath = filePathContract.parse(`${wardDir}/${latestFile}`);
    const contents = await readFile(filePath);
    return wardResultContract.parse(JSON.parse(contents));
  } catch {
    return null;
  }
};
