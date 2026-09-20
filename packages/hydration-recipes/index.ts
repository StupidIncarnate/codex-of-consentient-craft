/**
 * PURPOSE: The manifest, listing and startup entry point for @dungeonmaster/hydration-recipes.
 * Exports the startup interface StartHydrationRecipes alongside recipesManifest and legacy brokers
 * for siegelense compatibility.
 *
 * USAGE:
 * import {
 *   StartHydrationRecipes,
 *   recipesManifest,
 *   recipesListingBuildBroker,
 *   recipesSeedRunBroker,
 * } from '@dungeonmaster/hydration-recipes';
 * const listing = StartHydrationRecipes.listing();
 * const seeded = await StartHydrationRecipes.seed({ recipeName: 'guild-mid-execution', home: '/tmp/test' });
 */
import { recipeManifestContract } from '@dungeonmaster/hydration/contracts';

import { recipesCatalogBroker } from './src/brokers/recipes/catalog/recipes-catalog-broker';

export const recipesManifest = recipeManifestContract.parse(
  recipesCatalogBroker().map(({ recipeName, description, inputs }) => ({
    recipeName,
    description,
    ...(inputs === undefined ? {} : { inputs }),
  })),
);

export * from './src/brokers/recipes-listing/build/recipes-listing-build-broker';

export * from './src/brokers/recipes-seed/run/recipes-seed-run-broker';

export * from './src/startup/start-hydration-recipes';
