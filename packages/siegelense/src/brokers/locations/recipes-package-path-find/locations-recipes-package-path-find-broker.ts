/**
 * PURPOSE: Resolves the absolute path of the recipes package — `<repoRoot>/packages/siegelense-recipes`.
 * Reach for this over `locationsRootPathFindBroker`, which answers for the siegelense HOME (the shared
 * registry and instance assets on this machine): recipes are SOURCE, committed with the repo, and a
 * repo checked out twice has two recipe books and one registry. The repo root is resolved from the
 * caller's own cwd rather than from this package's `__dirname`, because an installed siegelense lives
 * under the consumer's `node_modules` and the recipes it must enumerate are the consumer's.
 *
 * USAGE:
 * await locationsRecipesPackagePathFindBroker();
 * // Returns AbsoluteFilePath '<repoRoot>/packages/siegelense-recipes'
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { recipeLocationStatics } from '../../../statics/recipe-location/recipe-location-statics';

export const locationsRecipesPackagePathFindBroker = async (): Promise<AbsoluteFilePath> => {
  const cwdPath = processCwdAdapter();
  const repoRoot = await cwdResolveBroker({ startPath: cwdPath, kind: 'repo-root' });

  const joined = pathJoinAdapter({
    paths: [repoRoot, ...recipeLocationStatics.packageDir.segments],
  });

  return absoluteFilePathContract.parse(joined);
};
