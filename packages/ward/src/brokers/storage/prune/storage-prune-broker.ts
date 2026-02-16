/**
 * PURPOSE: Deletes ward run-result files older than the configured TTL from the .ward directory
 *
 * USAGE:
 * await storagePruneBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Removes run files older than 1 hour from .ward directory
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { ttlStatics } from '../../../statics/ttl/ttl-statics';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';

const RUN_PREFIX_LENGTH = 'run-'.length;

export const storagePruneBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<void> => {
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);

  try {
    const entries = await fsReaddirAdapter({ dirPath: wardDir });
    const now = Date.now();

    const deletePromises = entries
      .filter((entry) => {
        const name = String(entry);
        if (!name.startsWith('run-') || !name.endsWith('.json')) {
          return false;
        }
        const timestampStr = name.slice(RUN_PREFIX_LENGTH, name.indexOf('-', RUN_PREFIX_LENGTH));
        const timestamp = Number(timestampStr);
        if (Number.isNaN(timestamp)) {
          return false;
        }
        return now - timestamp > ttlStatics.runResultTtl;
      })
      .map(async (entry) => {
        const filePath = filePathContract.parse(`${wardDir}/${entry}`);
        return fsUnlinkAdapter({ filePath });
      });

    await Promise.all(deletePromises);
  } catch {
    // .ward directory may not exist yet - safe to ignore
  }
};
