/**
 * PURPOSE: Layer of commandRunBroker — returns the passthrough paths that are NOT on disk, so a
 * scope built from a typo stops the run instead of quietly matching no package
 *
 * USAGE:
 * const missing = commandRunLayerPathCheckBroker({ passthrough: config.passthrough, rootPath });
 * // ['packages/wardd/src/index.ts'] — empty array when every path resolves
 *
 * IT RUNS AFTER `passthroughNormalizeTransformer`, deliberately: that transformer is what turns
 * `./packages/…` and an absolute path into the repo-relative form, and checking before it would
 * report a spelling this run was about to repair. Every path here is therefore repo-relative and is
 * resolved against `rootPath`.
 *
 * IT ANSWERS EXISTENCE ONLY, never ownership. A path that exists but sits outside `packages/*` —
 * `scripts/`, `eslint.config.js` — resolves here and is a separate question, because whether that
 * should fail a run depends on what the repo's lint and tsconfig actually cover.
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';

export const commandRunLayerPathCheckBroker = ({
  passthrough,
  rootPath,
}: {
  passthrough: WardConfig['passthrough'];
  rootPath: AbsoluteFilePath;
}): NonNullable<WardConfig['passthrough']> => {
  if (passthrough === undefined) {
    return [];
  }

  return passthrough.filter(
    (arg) =>
      !fsExistsSyncAdapter({
        filePath: filePathContract.parse(`${String(rootPath)}/${String(arg)}`),
      }),
  );
};
