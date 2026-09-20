/**
 * PURPOSE: Names one key in a recipe's declared inputs, as siegelense's own wire contract sees it.
 * Reach for this over a bare `z.string()` wherever a value is a KEY into a recipe's inputs rather
 * than the input's value — `recipeListingEntryContract`'s `inputKeys` array, and a `seed` step's
 * `params` record key. Its own domain because both sides need it: a recipe listing entry and a step
 * contract are two different files, and this repo allows one exported value per file.
 *
 * USAGE:
 * recipeInputKeyContract.parse('guildPath');
 * // Returns a branded RecipeInputKey
 */

import { z } from 'zod';

export const recipeInputKeyContract = z.string().min(1).brand<'RecipeInputKey'>();

export type RecipeInputKey = z.infer<typeof recipeInputKeyContract>;
