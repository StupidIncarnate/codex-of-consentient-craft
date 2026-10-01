/**
 * PURPOSE: Answers whether ward's jest child may be told to prefer the `source` export condition —
 * true only where the barrel that condition names is actually on disk.
 *
 * USAGE:
 * const supported = sourceConditionSupportedBroker({ cwd: '/repo/packages/ward' });
 * // Returns true in this monorepo, false in a consumer's install
 *
 * WHY THE CONDITION IS WANTED: the jest configs ask for `source` through `testEnvironmentOptions`,
 * which only governs what the TEST environment resolves. The transform glue's own
 * `@dungeonmaster/shared` imports are resolved by NODE, outside that environment, so without the
 * flag the jest process itself reads `dist/` while the tests it runs read source — measured.
 *
 * WHY IT CANNOT BE UNCONDITIONAL: `@dungeonmaster/shared` advertises a `source` condition naming
 * `./src/<folderType>/<folderType>.ts` on every barrel subpath while its `files` field packs `dist`
 * only, so an INSTALLED copy carries no barrel at all. Node does not fall back to `require`/`default` when a matched condition names a
 * missing file — it throws `MODULE_NOT_FOUND` naming the `.ts` path. Ward is published and runs in
 * other people's repos, so an unconditional flag kills the jest process there before a single test
 * loads. Reachability of the barrel is what tells the two worlds apart: a workspace symlink into
 * `packages/shared` here, a packed `dist`-only tree there.
 */

import { existsSync } from '#gateway/node/fs';

// The `source` target of shared's `./statics` export key, exactly. A stale suffix answers false in
// this monorepo too, and the Playwright process then dies loading its first `.stub` subpath, a key
// that carries ONLY `source`. The integration test beside this file grades it against the real tree.
const SOURCE_BARREL_SUFFIX = '/node_modules/@dungeonmaster/shared/src/statics/statics.ts';

export const sourceConditionSupportedBroker = ({ cwd }: { cwd: string }): boolean => {
  const segments = cwd.split('/');

  // Node resolves a bare specifier by walking `node_modules` up from the importer, and ward's cwd
  // is a package folder inside a workspace root — so the barrel usually sits several levels above.
  const ancestors = [...segments.keys()]
    .map((index) => segments.slice(0, segments.length - index).join('/'))
    .filter((ancestor) => ancestor !== '');

  return ancestors.some((ancestor) => existsSync(`${ancestor}${SOURCE_BARREL_SUFFIX}`));
};
