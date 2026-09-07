/**
 * PURPOSE: Answers whether ward's jest child may be told to prefer the `source` export condition —
 * true only where the barrel that condition names is actually on disk.
 *
 * USAGE:
 * const supported = sourceConditionSupportedBroker({ cwd: absoluteFilePathContract.parse('/repo/packages/ward') });
 * // Returns true in this monorepo, false in a consumer's install
 *
 * WHY THE CONDITION IS WANTED: the jest configs ask for `source` through `testEnvironmentOptions`,
 * which only governs what the TEST environment resolves. The transform glue's own
 * `@dungeonmaster/shared` imports are resolved by NODE, outside that environment, so without the
 * flag the jest process itself reads `dist/` while the tests it runs read source — measured.
 *
 * WHY IT CANNOT BE UNCONDITIONAL: `@dungeonmaster/shared` advertises `"source": "./contracts.ts"`
 * on all nine subpaths while its `files` field packs `dist` only, so an INSTALLED copy carries no
 * barrel at all. Node does not fall back to `require`/`default` when a matched condition names a
 * missing file — it throws `MODULE_NOT_FOUND` naming the `.ts` path. Ward is published and runs in
 * other people's repos, so an unconditional flag kills the jest process there before a single test
 * loads. Reachability of the barrel is what tells the two worlds apart: a workspace symlink into
 * `packages/shared` here, a packed `dist`-only tree there.
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

const SOURCE_BARREL_SUFFIX = '/node_modules/@dungeonmaster/shared/statics.ts';

export const sourceConditionSupportedBroker = ({ cwd }: { cwd: AbsoluteFilePath }): boolean => {
  const segments = String(cwd).split('/');

  // Node resolves a bare specifier by walking `node_modules` up from the importer, and ward's cwd
  // is a package folder inside a workspace root — so the barrel usually sits several levels above.
  const ancestors = [...segments.keys()]
    .map((index) => segments.slice(0, segments.length - index).join('/'))
    .filter((ancestor) => ancestor !== '');

  return ancestors.some((ancestor) =>
    fsExistsSyncAdapter({
      filePath: filePathContract.parse(`${ancestor}${SOURCE_BARREL_SUFFIX}`),
    }),
  );
};
