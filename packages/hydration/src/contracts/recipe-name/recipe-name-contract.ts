/**
 * PURPOSE: Names one recipe, and is the key of its entry in the generated input union. Reach for
 * this over `ingredientNameContract` wherever the value crosses the MCP wire — a `seed` step
 * names a recipe, never an ingredient.
 *
 * USAGE:
 * recipeNameContract.parse('guild-mid-execution');
 * // Returns a branded RecipeName
 */
import { z } from 'zod';

export const recipeNameContract = z.string().min(1).brand<'RecipeName'>();

export type RecipeName = z.infer<typeof recipeNameContract>;
