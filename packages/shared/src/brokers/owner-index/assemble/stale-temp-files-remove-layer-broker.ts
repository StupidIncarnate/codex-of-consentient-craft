/**
 * PURPOSE: Removes the owner index cache folder's temp files older than
 * ownerIndexStatics.cache.staleTempMs — what a writer killed between its write and its rename leaves
 * behind. A younger temp file may belong to a writer still running, so it stays. Best-effort: a
 * file another process already removed is skipped, and any other failure is one stderr line, never
 * a thrown error, since the cache only ever saves time.
 *
 * USAGE:
 * staleTempFilesRemoveLayerBroker({ cacheDir: '/repo/node_modules/.cache/dungeonmaster/owner-index' });
 * // Removes '<shard>.json.<pid>-<threadId>.tmp' files last written over an hour ago
 */
import { isFsError, readdirEntriesSync, statSync, unlinkSync } from '#gateway/node/fs';
import { now } from '#gateway/node/Date';
import { stderr } from '#gateway/node/process';

import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';

export const staleTempFilesRemoveLayerBroker = ({ cacheDir }: { cacheDir: string }): void => {
  const cutoffMs = now() - ownerIndexStatics.cache.staleTempMs;
  try {
    const tempPaths = readdirEntriesSync(cacheDir)
      .filter(
        (entry) => entry.kind === 'file' && entry.name.endsWith(ownerIndexStatics.cache.tempSuffix),
      )
      .map((entry) => `${cacheDir}/${entry.name}`);
    for (const tempPath of tempPaths) {
      try {
        if (statSync(tempPath).modifiedAtMs < cutoffMs) {
          unlinkSync(tempPath);
        }
      } catch (error: unknown) {
        if (!isFsError({ error, code: 'ENOENT' })) {
          stderr.write(
            `[owner-index] stale temp file not removed: ${tempPath}: ${String(error)}\n`,
          );
        }
      }
    }
  } catch (error: unknown) {
    stderr.write(`[owner-index] stale temp files not listed: ${cacheDir}: ${String(error)}\n`);
  }
};
