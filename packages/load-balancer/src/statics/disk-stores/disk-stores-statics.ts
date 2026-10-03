/**
 * PURPOSE: Defines the static registry of disk stores tracked and pruned by dungeonmaster,
 * including store scope, path patterns, item granularity, retention rules, and rate limits. Reach
 * for this over individual pruner statics when scanning or enforcing the machine disk budget.
 *
 * USAGE:
 * diskStoresStatics.stores;
 * // Returns array of tracked disk store configurations
 * diskStoresStatics.minAgeMs;
 * // Returns 600000
 */

export const diskStoresStatics = {
  stores: [
    {
      storeId: 'ward-run-results',
      scope: 'repo',
      pathPattern: '.ward/run-*.json',
      itemKind: 'file',
      inUseRule: 'newest-per-repo',
    },
    {
      storeId: 'ward-bundle-cache',
      scope: 'repo',
      pathPattern: 'packages/*/.ward/bundle/*',
      itemKind: 'folder',
      inUseRule: 'none',
    },
    {
      storeId: 'e2e-test-results',
      scope: 'repo',
      pathPattern: 'test-results/*',
      itemKind: 'folder',
      inUseRule: 'pid-in-name',
    },
    {
      storeId: 'e2e-vite-cache',
      scope: 'repo',
      pathPattern: 'node_modules/.vite-*',
      itemKind: 'folder',
      inUseRule: 'none',
    },
    {
      storeId: 'e2e-playwright-reports',
      scope: 'repo',
      pathPattern: '.ward-playwright-report-*.json',
      itemKind: 'file',
      inUseRule: 'none',
    },
    {
      storeId: 'jest-transform-cache',
      scope: 'user',
      pathPattern: '/tmp/jest_*/*',
      itemKind: 'folder',
      inUseRule: 'none',
    },
    {
      storeId: 'e2e-sandboxes',
      scope: 'user',
      pathPattern: '/tmp/dm-e2e-*',
      itemKind: 'folder',
      inUseRule: 'pid-in-name',
    },
    {
      storeId: 'jest-test-sandboxes',
      scope: 'user',
      pathPattern: '/tmp/dungeonmaster-jest-*',
      itemKind: 'folder',
      inUseRule: 'pid-in-name',
    },
    {
      storeId: 'siegelense-sandboxes',
      scope: 'user',
      pathPattern: '/tmp/dm-siege-*',
      itemKind: 'folder',
      inUseRule: 'siegelense-instance-alive',
    },
    {
      storeId: 'siegelense-evidence',
      scope: 'user',
      pathPattern: 'siegelense/**/instances/*',
      itemKind: 'folder',
      inUseRule: 'siegelense-instance-alive',
    },
  ],
  minAgeMs: 600_000,
  runEveryMs: 600_000,
  orphanedPortTimeoutMs: 86_400_000,
} as const;
