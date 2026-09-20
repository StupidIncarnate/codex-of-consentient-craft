/**
 * PURPOSE: The manifest, responders, and startup entry point for @dungeonmaster/hydration-recipes.
 * Exports the startup interface StartHydrationRecipes alongside recipesManifest, responders,
 * and key framework integration brokers.
 *
 * USAGE:
 * import {
 *   StartHydrationRecipes,
 *   recipesManifest,
 *   RecipesListingResponder,
 *   RecipesSeedResponder,
 *   dmRegistryBroker,
 * } from '@dungeonmaster/hydration-recipes';
 * const listing = StartHydrationRecipes.listing();
 * const seeded = await StartHydrationRecipes.seed({ recipeName: 'guild-mid-execution', home: '/tmp/test' });
 */
import { recipeManifestContract } from '@dungeonmaster/hydration/contracts';

import { RecipesListingResponder } from './responders';

export const recipesManifest = recipeManifestContract.parse(
  RecipesListingResponder().map(({ recipeName, description }) => ({
    recipeName,
    description,
  })),
);

export * from './responders';

export * from './src/brokers/dm/registry/dm-registry-broker';

export * from './src/brokers/recipes-hydration/create/recipes-hydration-create-broker';

export * from './src/brokers/quest/ingredient/quest-ingredient-broker';

export * from './src/startup/start-hydration-recipes';
