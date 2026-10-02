/**
 * PURPOSE: Configuration for the ban-ambient-module-resolve rule: the one file allowed to call
 * `require.resolve`, and the paths where the rule stays silent because the code is an I/O boundary
 * or test support.
 *
 * USAGE:
 * banAmbientModuleResolveStatics.sanctionedPathSubstring;
 * // '/packages/shared/src/brokers/module/resolve/module-resolve-broker.ts'
 */
export const banAmbientModuleResolveStatics = {
  // The one broker that owns `require.resolve`: it resolves from a given repo root first and falls
  // back to this process's own install only when that repo has none.
  sanctionedPathSubstring: '/packages/shared/src/brokers/module/resolve/module-resolve-broker.ts',
  // The gateway wrappers are the I/O boundary.
  exemptPathSubstrings: ['/packages/@gateway/'],
  exemptPathRegexSources: [
    '\\.test\\.tsx?$',
    '\\.integration\\.test\\.tsx?$',
    '\\.e2e\\.ts$',
    '\\.e2e\\.test\\.tsx?$',
    '\\.stub\\.tsx?$',
    '\\.proxy\\.tsx?$',
    '\\.harness\\.ts$',
  ],
} as const;
