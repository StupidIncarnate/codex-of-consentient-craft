/**
 * PURPOSE: Builds the `recipes {}` listing off this repo's recipes dynamically via the recipe
 * catalog, without dispatching a single route. Reach for this over individual recipe brokers when
 * building the full recipe listing.
 *
 * USAGE:
 * recipesListingBuildBroker();
 * // Returns one entry per recipe this repo declares: recipeName, description, inputKeys, runs, makes
 */

import type {
  PlanMakesEntry,
  PlanRunsResult,
  RecipeName,
} from '@dungeonmaster/hydration/contracts';
import type { RecipeDescription } from '../../../contracts/recipe-catalog-entry/recipe-catalog-entry-contract';
import type { RecipeInputKey } from '../../../contracts/recipe-input-key/recipe-input-key-contract';
import { recipesCatalogBroker } from '../../recipes/catalog/recipes-catalog-broker';

export const recipesListingBuildBroker = (): readonly {
  recipeName: RecipeName;
  description: RecipeDescription;
  inputKeys: readonly RecipeInputKey[];
  runs: PlanRunsResult;
  makes: readonly PlanMakesEntry[];
}[] =>
  recipesCatalogBroker().map((entry) => {
    const { runs, makes, inputKeys } = entry.probeListing();
    return {
      recipeName: entry.recipeName,
      description: entry.description,
      inputKeys,
      runs,
      makes,
    };
  });
