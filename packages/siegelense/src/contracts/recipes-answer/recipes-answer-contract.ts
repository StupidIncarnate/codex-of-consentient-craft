/**
 * PURPOSE: What `dungeonmaster siegelense recipes` hands back — every declared recipe's manifest,
 * ordered by name. An EMPTY list is a real answer here and means "no recipes yet"; the absent-package
 * case never reaches this shape at all, because `recipeBookReadBroker` throws
 * `RecipePackageMissingError` before building one. That split is the whole reason this answer carries
 * no `count` and no `ok` flag: there is nothing for a caller to disambiguate.
 *
 * The manifest type comes from `@dungeonmaster/siegelense-recipes`, the package that owns the
 * recipes, so the listing cannot describe a shape the recipes themselves do not have.
 *
 * USAGE:
 * recipesAnswerContract.parse({ recipes: [] });
 * // Returns a validated RecipesAnswer meaning "no recipes yet"
 */

import { recipeManifestContract } from '@dungeonmaster/siegelense-recipes/contracts';
import { z } from 'zod';

export const recipesAnswerContract = z
  .object({
    recipes: z.array(recipeManifestContract),
  })
  .strict();

export type RecipesAnswer = z.infer<typeof recipesAnswerContract>;
