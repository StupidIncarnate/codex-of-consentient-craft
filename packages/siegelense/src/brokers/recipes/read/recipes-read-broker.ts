/**
 * PURPOSE: Imports the located recipes package's compiled entry and turns its
 * `recipesListingBuildBroker` export into a parsed `RecipesListing`. Everything this reads off the
 * imported module is `unknown` until `recipesListingContract` parses it — siegelense may import
 * neither `@dungeonmaster/hydration` nor `@dungeonmaster/hydration-recipes` (`siegelense-recipes.md`'s
 * "Three packages, and what may cross between them" table — "neither of the others"), so the
 * compiler never saw the shape crossing this boundary and a cast here would be trusting a payload
 * nobody checked. No caching: node's own module cache already makes a repeated `import()` of the
 * same path free.
 *
 * USAGE:
 * const listing = await recipesReadBroker();
 * // Returns RecipesListing — [] means the package declares no recipes yet, not an installation
 * // problem
 */

import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { recipesLocateBroker } from '../locate/recipes-locate-broker';
import {
  recipesListingContract,
  type RecipesListing,
} from '../../../contracts/recipes-listing/recipes-listing-contract';
import { RecipesListingExportInvalidError } from '../../../errors/recipes-listing-export-invalid/recipes-listing-export-invalid-error';

export const recipesReadBroker = async (): Promise<RecipesListing> => {
  const entryPath = await recipesLocateBroker();
  const recipesModule = await runtimeDynamicImportAdapter({ path: entryPath });

  const listingExportName = recipesConventionStatics.exports.listingBuild;
  const listingBuildExport =
    typeof recipesModule === 'object' && recipesModule !== null
      ? (recipesModule as Record<PropertyKey, unknown>)[listingExportName]
      : undefined;

  if (typeof listingBuildExport !== 'function') {
    throw new RecipesListingExportInvalidError({
      entryPath,
      exportName: listingExportName,
      found: typeof listingBuildExport,
    });
  }

  const rawListing = await (listingBuildExport as () => unknown)();

  return recipesListingContract.parse(rawListing);
};
