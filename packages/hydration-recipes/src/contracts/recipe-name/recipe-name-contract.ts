/**
 * PURPOSE: The lookup key a `seed` step and a `recipes` listing both name a recipe by — kebab-case,
 * so `seed session-with-nested-subagent` is a lookup rather than a pattern match
 * (siegelense-recipes.md line 698: "no parsing. A prelude step is data with a name, and the name is
 * a lookup"). Reach for this whenever the value identifies WHICH recipe; reach for
 * `recipeFidelityContract` instead when it says how that recipe built its state.
 *
 * USAGE:
 * recipeNameContract.parse('guild-with-three-quests');
 * // Returns a branded RecipeName
 */

import { z } from 'zod';

export const recipeNameContract = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    'Recipe name must be kebab-case — lower-case letters, digits and single hyphens, such as "guild-with-three-quests"',
  )
  .brand<'RecipeName'>();

export type RecipeName = z.infer<typeof recipeNameContract>;
