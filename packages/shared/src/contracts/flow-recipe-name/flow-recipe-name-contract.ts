/**
 * PURPOSE: Names one entry in `flow.recipes[]`, doubling as that entry's upsert `id`. A recipe
 * name contract already exists at
 * `packages/hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts`, but `shared`
 * cannot import it — `hydration-recipes` depends on `shared`, so an import the other way is a
 * dependency cycle. This is a SEPARATE brand carrying the identical kebab-case shape, the same
 * move `siegeInstanceIdContract`/`siegeRunIdContract` already make one folder over for the
 * identical reason. A resolver reading a `recipeId` a piece names (story 08) re-parses that
 * value through `hydration-recipes`' own `recipeNameContract` before comparing it against the
 * recipe book.
 *
 * USAGE:
 * flowRecipeNameContract.parse('pc-walk-1');
 * // Returns a branded FlowRecipeName
 */

import { z } from 'zod';

export const flowRecipeNameContract = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Recipe name must be kebab-case …')
  .brand<'FlowRecipeName'>();

export type FlowRecipeName = z.infer<typeof flowRecipeNameContract>;
