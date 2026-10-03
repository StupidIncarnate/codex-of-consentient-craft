/**
 * PURPOSE: Plans disk space budget reclamation by selecting oldest eligible items across stores
 * to bring total disk usage under a configured maximum megabyte cap.
 *
 * USAGE:
 * diskBudgetPlanTransformer({
 *   items: [diskItem],
 *   maxDiskMB: 4096,
 *   nowMs: 1700000000000,
 * });
 * // Returns: DiskBudgetPlan with deletions, remainingBytes, shortfallBytes
 */

import type { DiskItem } from '../../contracts/disk-item/disk-item-contract';
import { diskStoresStatics } from '../../statics/disk-stores/disk-stores-statics';

const BYTES_PER_MEGABYTE = 1_048_576;
const NO_SHORTFALL = 0;
const FLOOR_MINIMUM = 0;

export const diskBudgetPlanTransformer = ({
  items,
  maxDiskMB,
  mode = 'default',
  nowMs = Date.now(),
}: {
  items: readonly DiskItem[];
  maxDiskMB: number;
  mode?: 'default' | 'all';
  nowMs?: number;
}): {
  deletions: readonly DiskItem[];
  totalBytes: number;
  remainingBytes: number;
  capBytes: number;
  shortfallBytes: number;
} => {
  const capBytes = mode === 'all' ? 0 : maxDiskMB * BYTES_PER_MEGABYTE;
  const totalBytes = items.reduce((sum, item) => sum + item.bytes, 0);

  if (mode !== 'all' && totalBytes <= capBytes) {
    return {
      deletions: [],
      totalBytes,
      remainingBytes: totalBytes,
      capBytes,
      shortfallBytes: NO_SHORTFALL,
    };
  }

  const eligible = items.filter(
    (item) =>
      item.protectedReason === null &&
      (mode === 'all' || nowMs - item.mtimeMs >= diskStoresStatics.minAgeMs),
  );

  const sortedEligible = [...eligible].sort((itemA, itemB) => {
    if (itemA.mtimeMs !== itemB.mtimeMs) {
      return itemA.mtimeMs - itemB.mtimeMs;
    }
    return itemA.path.localeCompare(itemB.path);
  });

  const deletions: DiskItem[] = [];
  let deletedBytes = 0;

  for (const item of sortedEligible) {
    deletions.push(item);
    deletedBytes += item.bytes;
    if (totalBytes - deletedBytes <= capBytes) {
      break;
    }
  }

  const remainingBytes = totalBytes - deletedBytes;
  const shortfallBytes = Math.max(FLOOR_MINIMUM, remainingBytes - capBytes);

  return {
    deletions,
    totalBytes,
    remainingBytes,
    capBytes,
    shortfallBytes,
  };
};
