/**
 * PURPOSE: Deletes ward run-result files older than the configured TTL from the .ward directory
 *
 * USAGE:
 * await storagePruneBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Removes run files older than ttlStatics.runResultTtl from the .ward directory
 */

import {
  adapterResultContract,
  filePathContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';

import { ttlStatics } from '../../../statics/ttl/ttl-statics';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';

const RUN_PREFIX_LENGTH = 'run-'.length;

export const storagePruneBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);

  try {
    const entries = await fsReaddirAdapter({ dirPath: wardDir });
    const now = Date.now();

    const runFiles = entries.filter((entry) => {
      const name = String(entry);
      return name.startsWith('run-') && name.endsWith('.json');
    });

    const judged = await Promise.all(
      runFiles.map(async (entry) => {
        const name = String(entry);
        const filePath = filePathContract.parse(`${wardDir}/${name}`);
        const timestampStr = name.slice(RUN_PREFIX_LENGTH, name.indexOf('-', RUN_PREFIX_LENGTH));
        const timestamp = Number(timestampStr);

        if (!Number.isNaN(timestamp)) {
          return { filePath, expired: now - timestamp > ttlStatics.runResultTtl };
        }

        // A run id need not carry a timestamp. The fake ward the web e2e dispatch harness runs
        // writes `run-e2e-dispatch-ward-<n>.json`, and storageLoadBroker is tested against exactly
        // that shape, so the name is legitimate. Reading an unparseable timestamp as "not a run
        // file" made those immortal — no age could ever expire them, and files five weeks old
        // survived every sweep. The file's own mtime answers the same question for any id shape.
        const stats = await fsStatAdapter({ filePath });
        if (stats === null) {
          return { filePath, expired: false };
        }
        return { filePath, expired: now - stats.mtimeMs > ttlStatics.runResultTtl };
      }),
    );

    await Promise.all(
      judged
        .filter((candidate) => candidate.expired)
        .map(async (candidate) => fsUnlinkAdapter({ filePath: candidate.filePath })),
    );
  } catch {
    // .ward directory may not exist yet - safe to ignore
  }
  return result;
};
