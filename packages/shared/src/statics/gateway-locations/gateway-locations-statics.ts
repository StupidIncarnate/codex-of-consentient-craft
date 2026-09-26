/**
 * PURPOSE: Names and locates the gateway packages — @<scope>/npm, @<scope>/node, @<scope>/browser
 * and @<scope>/bin — the sole boundary where an outside npm package, a Node module or global, a
 * browser global, or a spawned program may be touched directly. `folders` names each gateway
 * package's directory under `packages/`, read by anything building a scoped import path
 * (gatewayPathFromImportSourceTransformer) instead of hard-coding 'node'/'npm'/'browser'/'bin'.
 * `packageGlobs` is the file-glob shape the gateway's own carve-out (the ESLint config block that
 * re-scopes rules for gateway files) and any other consumer needing "is this file inside the
 * gateway" match against — every gateway `.ts` file sits under that package's own `src/`.
 *
 * USAGE:
 * gatewayLocationsStatics.folders.node;
 * // Returns 'node'
 * gatewayLocationsStatics.packageGlobs;
 * // Returns ['packages/npm/src/**', 'packages/node/src/**', 'packages/browser/src/**', 'packages/bin/src/**']
 */

export const gatewayLocationsStatics = {
  folders: {
    npm: 'npm',
    node: 'node',
    browser: 'browser',
    bin: 'bin',
  },
  packageGlobs: [
    'packages/npm/src/**',
    'packages/node/src/**',
    'packages/browser/src/**',
    'packages/bin/src/**',
  ],
} as const;
