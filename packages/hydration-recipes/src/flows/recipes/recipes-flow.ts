/**
 * PURPOSE: Orchestrates recipe operations by delegating to recipe responders. Entry point for
 * recipe flows across this package.
 *
 * USAGE:
 * const listing = RecipesFlow.listing();
 * const result = await RecipesFlow.seed({ recipeName: 'guild-mid-execution', home: '/tmp/lane-1' });
 */

import { RecipesListingResponder } from '../../responders/recipes/listing/recipes-listing-responder';
import { RecipesSeedResponder } from '../../responders/recipes/seed/recipes-seed-responder';

type ListingResult = ReturnType<typeof RecipesListingResponder>;
type SeedParams = Parameters<typeof RecipesSeedResponder>[0];
type SeedResult = Awaited<ReturnType<typeof RecipesSeedResponder>>;

export const RecipesFlow = {
  listing: (): ListingResult => RecipesListingResponder(),

  seed: async (params: SeedParams): Promise<SeedResult> => RecipesSeedResponder(params),
};
