/**
 * PURPOSE: Enforces the machine disk space budget by scanning tracked stores, planning evictions,
 * and deleting excess eligible files while honoring rate limits and symlink safety constraints.
 * Reach for this over diskScanBroker when actual deletion of unneeded files is required.
 *
 * USAGE:
 * const result = await diskBudgetEnforceBroker({ currentRepoRoot: '/path/to/repo' });
 * // Returns { ran: true, deletedBytes: 1048576, deletedCount: 2, shortfallBytes: 0, skipped: 0, scannedItems: [...], deletedItems: [...] }
 */

import { realpath, rm } from '#gateway/node/fs__promises';
import { dirname } from '#gateway/node/path';
import type { DiskItem } from '../../../contracts/disk-item/disk-item-contract';
import { diskStoresStatics } from '../../../statics/disk-stores/disk-stores-statics';
import { diskBudgetPlanTransformer } from '../../../transformers/disk-budget-plan/disk-budget-plan-transformer';
import { limitsReadBroker } from '../../limits/read/limits-read-broker';
import { registryOpenBroker } from '../../registry/open/registry-open-broker';
import { diskScanBroker } from '../scan/disk-scan-broker';

export const diskBudgetEnforceBroker = async ({
  currentRepoRoot,
  mode = 'default',
  nowMs,
  maxDiskMB: maxDiskMBOverride,
}: {
  currentRepoRoot: string;
  mode?: 'default' | 'all';
  nowMs?: number;
  maxDiskMB?: number;
}): Promise<{
  ran: boolean;
  deletedBytes: number;
  deletedCount: number;
  shortfallBytes: number;
  skipped: number;
  scannedItems: readonly DiskItem[];
  deletedItems: readonly DiskItem[];
}> => {
  const currentTime = nowMs ?? Date.now();
  const { resources, guildPaths } = await limitsReadBroker();
  const database = registryOpenBroker();

  if (mode !== 'all') {
    const row = database
      .prepare('SELECT value FROM meta WHERE key = ?;')
      .get('diskBudgetLastRunMs');

    if (row !== undefined && typeof row.value === 'string') {
      const lastRunMs = Number(row.value);
      if (!Number.isNaN(lastRunMs) && currentTime - lastRunMs < diskStoresStatics.runEveryMs) {
        return {
          ran: false,
          deletedBytes: 0,
          deletedCount: 0,
          shortfallBytes: 0,
          skipped: 0,
          scannedItems: [],
          deletedItems: [],
        };
      }
    }
  }

  database
    .prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);')
    .run('diskBudgetLastRunMs', String(currentTime));

  const repoRoots = Array.from(new Set([currentRepoRoot, ...guildPaths]));
  const scan = await diskScanBroker({ repoRoots, nowMs: currentTime });

  const effectiveMaxDiskMB = maxDiskMBOverride ?? resources.maxDiskMB;
  const plan = diskBudgetPlanTransformer({
    items: scan.items,
    maxDiskMB: effectiveMaxDiskMB,
    mode,
    nowMs: currentTime,
  });

  await Promise.all(
    plan.deletions.map(async (item) => {
      try {
        const realStoreDir = await realpath(dirname(item.path));
        const realItemPath = await realpath(item.path);
        const normalizedStoreDir = realStoreDir.endsWith('/') ? realStoreDir : `${realStoreDir}/`;
        if (!realItemPath.startsWith(normalizedStoreDir)) {
          return;
        }
      } catch {
        return;
      }

      try {
        await rm(item.path, { recursive: true, force: true });
      } catch {
        // Catch error: if ENOENT, item already gone, which is fine; other errors skip.
      }
    }),
  );

  return {
    ran: true,
    deletedBytes: plan.totalBytes - plan.remainingBytes,
    deletedCount: plan.deletions.length,
    shortfallBytes: plan.shortfallBytes,
    skipped: scan.skipped,
    scannedItems: scan.items,
    deletedItems: plan.deletions,
  };
};
