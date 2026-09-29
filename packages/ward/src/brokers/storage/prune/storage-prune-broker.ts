/**
 * PURPOSE: Deletes ward run-result files from the .ward directory that are older than the TTL, then
 * the oldest survivors beyond the folder's byte budget. The newest file is never removed: it is the
 * result of the run that just saved, and an oversized one is kept over deleting evidence in use.
 *
 * USAGE:
 * await storagePruneBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Removes run files older than ttlStatics.runResultTtl, then oldest files past the storageBudgetStatics cap
 */

import { readdirIfExists, statIfExists, unlink } from '#gateway/node/fs__promises';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { storageBudgetStatics } from '../../../statics/storage-budget/storage-budget-statics';
import { ttlStatics } from '../../../statics/ttl/ttl-statics';

const RUN_PREFIX_LENGTH = 'run-'.length;

export const storagePruneBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<void> => {
  const wardDir = filePathContract.parse(`${rootPath}/.ward`);

  try {
    const entries = await readdirIfExists(String(wardDir));
    if (entries === null) {
      return;
    }
    const now = Date.now();

    const runFiles = entries.filter((entry) => entry.startsWith('run-') && entry.endsWith('.json'));

    const judged = await Promise.all(
      runFiles.map(async (name) => {
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
        const stats = await statIfExists(String(filePath));
        if (stats === null) {
          return { filePath, expired: false };
        }
        return { filePath, expired: now - stats.modifiedAtMs > ttlStatics.runResultTtl };
      }),
    );

    const survivors = judged.filter((candidate) => !candidate.expired);

    // Newest first by mtime, the one clock every id shape has. A file that vanished between the
    // readdir and this stat is somebody else's sweep and counts for nothing.
    const measured = (
      await Promise.all(
        survivors.map(async ({ filePath }) => {
          const stats = await statIfExists(String(filePath));
          return stats === null
            ? null
            : { filePath, sizeBytes: stats.sizeBytes, modifiedAtMs: stats.modifiedAtMs };
        }),
      )
    )
      .filter((file) => file !== null)
      .sort(
        (a, b) =>
          b.modifiedAtMs - a.modifiedAtMs || String(b.filePath).localeCompare(String(a.filePath)),
      );

    // Once the running total passes the budget, every older file goes too, small ones included, so
    // what is kept stays one unbroken stretch of recent runs.
    const overBudget = measured.reduce(
      (acc, file, index) => {
        const keptBytes = acc.keptBytes + file.sizeBytes;
        const exceeded =
          acc.exceeded ||
          (index > 0 && keptBytes > storageBudgetStatics.limits.runResultsPerFolderBytes);
        return exceeded
          ? {
              keptBytes: acc.keptBytes,
              exceeded,
              paths: [...acc.paths, { filePath: file.filePath, expired: true }],
            }
          : { keptBytes, exceeded, paths: acc.paths };
      },
      { keptBytes: 0, exceeded: false, paths: survivors.slice(0, 0) },
    ).paths;

    await Promise.all(
      [...judged.filter((candidate) => candidate.expired), ...overBudget].map(async (candidate) => {
        await unlink(candidate.filePath);
      }),
    );
  } catch {
    // .ward directory may not exist yet - safe to ignore
  }
};
