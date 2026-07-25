/**
 * PURPOSE: Reads a WardResult from .ward/run-<id>.json or finds the most recent run
 *
 * USAGE:
 * const result = await storageLoadBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns the most recent WardResult or null if none found
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  wardResultContract,
  type WardResult,
} from '../../../contracts/ward-result/ward-result-contract';
import { runIdContract, type RunId } from '../../../contracts/run-id/run-id-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';

const RUN_FILE_PREFIX = 'run-';
const RUN_FILE_SUFFIX = '.json';

export const storageLoadBroker = async ({
  rootPath,
  runId,
}: {
  rootPath: AbsoluteFilePath;
  runId?: RunId;
}): Promise<WardResult | null> => {
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);

  if (runId) {
    const filePath = filePathContract.parse(`${wardDir}/run-${runId}.json`);
    try {
      const contents = await fsReadFileAdapter({ filePath });
      const parsed: unknown = JSON.parse(contents);
      return wardResultContract.parse(parsed);
    } catch {
      return null;
    }
  }

  try {
    const entries = await fsReaddirAdapter({ dirPath: wardDir });
    // Only `run-<RunId>.json` files are real runs. Test harnesses that emulate ward write
    // arbitrarily-named run files into the same directory; those sort after the timestamped ones
    // and would otherwise shadow the newest real run.
    const runFiles = entries
      .map(String)
      .filter((entry) => entry.startsWith(RUN_FILE_PREFIX) && entry.endsWith(RUN_FILE_SUFFIX))
      .filter(
        (entry) =>
          runIdContract.safeParse(entry.slice(RUN_FILE_PREFIX.length, -RUN_FILE_SUFFIX.length))
            .success,
      )
      .sort();

    if (runFiles.length === 0) {
      return null;
    }

    const latestFile = runFiles[runFiles.length - 1];
    const filePath = filePathContract.parse(`${wardDir}/${latestFile}`);
    const contents = await fsReadFileAdapter({ filePath });
    const parsed: unknown = JSON.parse(contents);
    return wardResultContract.parse(parsed);
  } catch {
    return null;
  }
};
