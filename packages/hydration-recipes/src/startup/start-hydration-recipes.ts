/**
 * PURPOSE: Application initialization and public API entry point for
 * @dungeonmaster/hydration-recipes. Wires up recipe flows for listing and seeding.
 *
 * USAGE:
 * import { StartHydrationRecipes } from '@dungeonmaster/hydration-recipes';
 * const listing = StartHydrationRecipes.listing();
 * const result = await StartHydrationRecipes.seed({ recipeName: 'guild-mid-execution', home: '/tmp/test' });
 */

import { RecipesFlow } from '../flows/recipes/recipes-flow';

type ListingResult = ReturnType<typeof RecipesFlow.listing>;
type SeedParams = Parameters<typeof RecipesFlow.seed>[0];
type SeedResult = Awaited<ReturnType<typeof RecipesFlow.seed>>;

export const StartHydrationRecipes = {
  listing: (): ListingResult => RecipesFlow.listing(),

  seed: async (params: SeedParams): Promise<SeedResult> => RecipesFlow.seed(params),
};
