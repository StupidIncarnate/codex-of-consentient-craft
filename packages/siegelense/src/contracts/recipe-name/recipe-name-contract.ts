/**
 * PURPOSE: Names one recipe as siegelense's own wire contract sees it. Declared independently of
 * `@dungeonmaster/hydration`'s `recipeNameContract` — the tool may import neither
 * `@dungeonmaster/hydration` nor `@dungeonmaster/hydration-recipes` (`siegelense-recipes.md`'s
 * "Three packages, and what may cross between them" table — "neither of the others"), so this
 * parses the recipe name a dynamically imported listing hands back rather than trusting a type the
 * compiler never saw cross that boundary.
 *
 * USAGE:
 * recipeNameContract.parse('guild-mid-execution');
 * // Returns a branded RecipeName
 */

import { z } from 'zod';

export const recipeNameContract = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    'Recipe name must be kebab-case — lower-case letters, digits and single hyphens, such as "guild-with-three-quests"',
  )
  .brand<'RecipeName'>();

export type RecipeName = z.infer<typeof recipeNameContract>;
