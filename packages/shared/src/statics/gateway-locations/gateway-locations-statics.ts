/**
 * PURPOSE: Names and locates the gateway packages — @<scope>/npm, @<scope>/node, @<scope>/browser
 * and @<scope>/bin — the sole boundary where an outside npm package, a Node module or global, a
 * browser global, or a spawned program may be touched directly. `folders` is the ONE list of gateway
 * folder names — every other shape in this file, and every hand-typed copy in `cli` and each
 * workspace package's own `package.json`, derives from or is checked against it. `folders` names
 * each gateway package's directory name (never its full path under `packages/@gateway/`), read by
 * anything building a scoped import path (gatewayPathFromImportSourceTransformer) instead of
 * hard-coding 'node'/'npm'/'browser'/'bin'. `packageGlobs` is computed from `folders`, one glob per
 * name, so adding or renaming a folder here changes both together — it is the file-glob shape the
 * gateway's own carve-out (the ESLint config block that re-scopes rules for gateway files) and any
 * other consumer needing "is this file inside the gateway" match against — every gateway `.ts` file
 * sits under that package's own `src/`. A consumer that needs the bare folder name (`npm`, `node`, …)
 * reads `folders` directly rather than splitting a glob — the glob's directory segments are
 * `packages/@gateway/<folder>/src`, not `packages/<folder>/src`, so a positional split lands on
 * `@gateway` instead. `importPrefix` is the text every caller imports the gateway through
 * (`#gateway/<folder>/<subpath>`), mapped by each package's own `package.json` `imports` field, so
 * the import reads the same in every repo whatever the gateway packages are named. `testSubpath`
 * names each gateway package's proxy barrel; it starts with `_` because no npm package name can,
 * so it never collides with a real subpath.
 *
 * USAGE:
 * gatewayLocationsStatics.folders.node;
 * // Returns 'node'
 * gatewayLocationsStatics.importPrefix;
 * // Returns '#gateway'
 * gatewayLocationsStatics.packageGlobs;
 * // Returns ['packages/@gateway/npm/src/**', 'packages/@gateway/node/src/**', 'packages/@gateway/browser/src/**', 'packages/@gateway/bin/src/**']
 */

const folders = {
  npm: 'npm',
  node: 'node',
  browser: 'browser',
  bin: 'bin',
} as const;

const packageGlobs = Object.values(folders).map((folder) => `packages/@gateway/${folder}/src/**`);

export const gatewayLocationsStatics = {
  folders,
  importPrefix: '#gateway',
  testSubpath: '_test_',
  packageGlobs,
} as const;
