/**
 * PURPOSE: The whole of `dungeonmaster siegelense recipes` — every declared recipe, with its
 * `produces:`, its `fidelity` and its `mirrors:`, read as DATA. Nothing here executes a recipe:
 * the listing is asked before anything has been seeded, and one that had to run every recipe to
 * describe them would seed a machine just to answer a question (siegelense-tooling.md line 1995).
 * That is also why no instance is started and no pool slot is held.
 *
 * The package's PRESENCE is checked before the book is read, and that order is the point: an empty
 * book answers `recipes: []`, meaning "no recipes yet", while an absent package throws
 * `RecipePackageMissingError`, meaning "siegelense was never installed here". Read the book first
 * and both cases answer the same empty list, which is the `count: 0` ambiguity this design keeps
 * running into.
 *
 * Entries are sorted by name so a listing is stable between calls — a session comparing two runs of
 * the same command should see a reordering only when the book changed.
 *
 * USAGE:
 * await recipeBookReadBroker();
 * // Returns a RecipesAnswer holding every declared recipe, ordered by name
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { recipeBookStatics } from '@dungeonmaster/siegelense-recipes/statics';

import {
  recipesAnswerContract,
  type RecipesAnswer,
} from '../../../contracts/recipes-answer/recipes-answer-contract';
import { RecipePackageMissingError } from '../../../errors/recipe-package-missing/recipe-package-missing-error';
import { locationsRecipesPackagePathFindBroker } from '../../locations/recipes-package-path-find/locations-recipes-package-path-find-broker';

export const recipeBookReadBroker = async (): Promise<RecipesAnswer> => {
  const packagePath = await locationsRecipesPackagePathFindBroker();

  const packagePresent = fsExistsSyncAdapter({
    filePath: filePathContract.parse(packagePath),
  });

  if (!packagePresent) {
    throw new RecipePackageMissingError({ expectedPath: packagePath });
  }

  const recipes = [...recipeBookStatics.recipes].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  return recipesAnswerContract.parse({ recipes });
};
