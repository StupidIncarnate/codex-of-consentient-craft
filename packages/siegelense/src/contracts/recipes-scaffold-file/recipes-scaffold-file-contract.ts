/**
 * PURPOSE: The element type `recipesScaffoldFilesTransformer`'s output list is built from — a path
 * relative to the new `hydration-recipes` package's own root, paired with the file's full contents —
 * so `InstallRecipesScaffoldResponder` can write each one without knowing what it is. Mirrors
 * `@dungeonmaster/cli`'s own `scaffoldFileContract` shape; kept local rather than imported so this
 * narrow, single-purpose scaffolder stays independently owned from `create-package`'s
 * general-purpose one (`siegelense-consumer-lanes.md`, section 3.6).
 *
 * USAGE:
 * recipesScaffoldFileContract.parse({ relativePath: 'package.json', contents: '{}\n' });
 * // Returns a validated RecipesScaffoldFile
 */

import { z } from 'zod';

import { pathSegmentContract, fileContentsContract } from '@dungeonmaster/shared/contracts';

export const recipesScaffoldFileContract = z.object({
  relativePath: pathSegmentContract,
  contents: fileContentsContract,
});

export type RecipesScaffoldFile = z.infer<typeof recipesScaffoldFileContract>;
