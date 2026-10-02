/**
 * PURPOSE: Computes the effective number of e2e shards to spawn for a test run.
 * Reach for this rather than computing shard counts inline, ensuring that runs with sharding
 * disabled or active test name pattern filters stay on a single shard, and that the shard count
 * never exceeds the number of available spec files.
 *
 * USAGE:
 * e2eShardCountTransformer({ shardingEnabled: true, requested: 3, specFileCount: 132 });
 * // Returns: 3
 */

import { e2eShardStatics } from '../../statics/e2e-shard/e2e-shard-statics';

export const e2eShardCountTransformer = ({
  shardingEnabled,
  requested = e2eShardStatics.defaultCount,
  specFileCount,
  testNamePattern,
}: {
  shardingEnabled: boolean;
  requested?: number;
  specFileCount: number;
  testNamePattern?: string | undefined;
}): number => {
  if (!shardingEnabled || (testNamePattern !== undefined && testNamePattern.length > 0)) {
    return 1;
  }

  return Math.max(1, Math.min(requested, specFileCount));
};
