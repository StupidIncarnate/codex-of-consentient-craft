/**
 * PURPOSE: Parses ONE recipe's row of the compiled recipes package's listing — the recipe's own
 * name, description and declared input keys, paired with the `runs`/`makes` shape
 * `dmRegistryBroker.listing(plan)` computes off its plan. siegelense may import neither
 * `@dungeonmaster/hydration` nor `@dungeonmaster/hydration-recipes` (`siegelense-recipes.md`'s
 * "Three packages, and what may cross between them" table — "neither of the others"), so a
 * dynamically imported module's entry is `unknown` until this parses it. `.strict()` for the
 * same reason every `stepContract` member is: a key the producing side added and this side has not
 * learned about must be refused, not silently stripped.
 *
 * USAGE:
 * recipeListingEntryContract.parse({
 *   recipeName: 'guild-mid-execution',
 *   description: 'one guild holding three quests',
 *   inputKeys: [],
 *   runs: { serverless: true },
 *   makes: [{ ingredient: 'guild', count: 1 }],
 * });
 * // Returns RecipeListingEntry
 */

import { z } from 'zod';

import { recipeInputKeyContract } from '../recipe-input-key/recipe-input-key-contract';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';

const recipeDescriptionContract = z.string().min(1).brand<'RecipeDescription'>();

const ingredientNameContract = z.string().min(1).brand<'IngredientName'>();

const makesCountContract = z.number().int().positive().brand<'MakesCount'>();

const recipeRunsContract = z.discriminatedUnion('serverless', [
  z.object({ serverless: z.literal(true) }),
  z.object({ serverless: z.literal(false), needsServerFor: ingredientNameContract }),
]);

const recipeMakesEntryContract = z.object({
  ingredient: ingredientNameContract,
  count: z.union([makesCountContract, z.literal('varies')]),
});

export const recipeListingEntryContract = z
  .object({
    recipeName: recipeNameContract,
    description: recipeDescriptionContract,
    inputKeys: z.array(recipeInputKeyContract),
    runs: recipeRunsContract,
    makes: z.array(recipeMakesEntryContract),
  })
  .strict();

export type RecipeListingEntry = z.infer<typeof recipeListingEntryContract>;
