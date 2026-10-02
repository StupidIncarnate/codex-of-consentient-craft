/**
 * PURPOSE: Defines immutable configuration defaults for e2e test sharding.
 * Reach for this rather than hardcoding shard counts when configuring Playwright test execution.
 *
 * USAGE:
 * e2eShardStatics.defaultCount;
 * // Returns: 3
 */

export const e2eShardStatics = {
  defaultCount: 3,
} as const;
