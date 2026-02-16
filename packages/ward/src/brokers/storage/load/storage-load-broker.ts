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
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';

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
    const runFiles = entries
      .filter((entry) => String(entry).startsWith('run-') && String(entry).endsWith('.json'))
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
