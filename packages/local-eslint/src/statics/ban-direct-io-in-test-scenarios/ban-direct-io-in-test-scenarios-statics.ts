/**
 * PURPOSE: Holds the static configuration for the ban-direct-io-in-test-scenarios ESLint rule.
 *
 * USAGE:
 * banDirectIoInTestScenariosStatics.bannedFsModules
 * // Returns ['fs', 'node:fs', ...]
 */
export const banDirectIoInTestScenariosStatics = {
  bannedFsModules: ['fs', 'node:fs', 'fs/promises', 'node:fs/promises'],
  bannedNamedImports: ['dmRegistryBroker', 'recipesHydrationCreateBroker'],
} as const;
