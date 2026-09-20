/**
 * PURPOSE: Responds to recipe listing requests by delegating to recipesListingBuildBroker. Reach
 * for this over directly calling recipesListingBuildBroker when accessing recipe listings from
 * outer layers or public responder barrels.
 *
 * USAGE:
 * const listing = RecipesListingResponder();
 * // Returns readonly RecipeListingEntry[]
 */

import { recipesListingBuildBroker } from '../../../brokers/recipes-listing/build/recipes-listing-build-broker';

type ListingResult = ReturnType<typeof recipesListingBuildBroker>;

export const RecipesListingResponder = (): ListingResult => recipesListingBuildBroker();
