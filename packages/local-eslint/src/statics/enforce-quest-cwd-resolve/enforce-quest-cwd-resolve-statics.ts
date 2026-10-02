/**
 * PURPOSE: Configuration for the enforce-quest-cwd-resolve rule: the binding it watches for, the
 * production files allowed to import it, and the companion-file suffixes that are exempt.
 *
 * USAGE:
 * enforceQuestCwdResolveStatics.bannedImportName;
 * // 'questRepoRootBroker'
 */
export const enforceQuestCwdResolveStatics = {
  bannedImportName: 'questRepoRootBroker',
  // Each entry is a path fragment; a linted file whose path contains one may import the binding.
  allowedPathFragments: [
    'packages/orchestrator/src/brokers/quest/cwd-resolve/quest-cwd-resolve-broker.ts',
    'packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts',
    'packages/orchestrator/src/brokers/quest/repo-root/',
  ],
  exemptFileSuffixes: ['.test.ts', '.proxy.ts', '.stub.ts', '.harness.ts'],
} as const;
