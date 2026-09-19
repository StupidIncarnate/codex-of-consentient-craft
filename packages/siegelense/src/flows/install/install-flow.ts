/**
 * PURPOSE: Orchestrates siegelense's three install responders — the `.siegelense` symlink onto
 * the resolved siegelense root, the `.gitignore` (and eslint-ignore) entries that keep it off
 * every check, and the `packages/hydration-recipes/src/` scaffold — into the one InstallResult
 * `dungeonmaster init` surfaces per package. `success` is the AND of all three, so one responder
 * failing is never read as an overall success. `action` takes the most significant of the three —
 * `failed` over `created` over `merged` over `skipped` — so a second `init` run, where every
 * responder finds its own target already in place and reports `skipped`, reads as `skipped`
 * rather than as a failure.
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Returns install result for siegelense after the link, ignore entries, and empty recipes
 * // package are all in place
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { InstallLinkCreateResponder } from '../../responders/install/link-create/install-link-create-responder';
import { InstallIgnoreWriteResponder } from '../../responders/install/ignore-write/install-ignore-write-responder';
import { InstallRecipesScaffoldResponder } from '../../responders/install/recipes-scaffold/install-recipes-scaffold-responder';

const PACKAGE_NAME = '@dungeonmaster/siegelense';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const linkResult = await InstallLinkCreateResponder({ context });
  const ignoreResult = await InstallIgnoreWriteResponder({ context });
  const recipesResult = await InstallRecipesScaffoldResponder({ context });

  const success = linkResult.success && ignoreResult.success && recipesResult.success;
  const actions = [linkResult.action, ignoreResult.action, recipesResult.action];

  const action = success
    ? actions.includes('created')
      ? 'created'
      : actions.includes('merged')
        ? 'merged'
        : 'skipped'
    : 'failed';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success,
    action,
    message: installMessageContract.parse(
      `${String(linkResult.message)}; ${String(ignoreResult.message)}; ${String(recipesResult.message)}`,
    ),
  };
};
