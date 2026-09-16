import { recipesListingContract } from './recipes-listing-contract';
import type { RecipesListing } from './recipes-listing-contract';

import { RecipeListingEntryStub } from '../recipe-listing-entry/recipe-listing-entry.stub';

type RecipesListingEntry = ReturnType<typeof RecipeListingEntryStub>;

export const RecipesListingStub = (
  { value }: { value: readonly RecipesListingEntry[] } = { value: [RecipeListingEntryStub()] },
): RecipesListing => recipesListingContract.parse(value);
