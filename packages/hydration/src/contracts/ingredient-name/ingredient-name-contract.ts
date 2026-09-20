/**
 * PURPOSE: Names one ingredient, and is what a child's `links.of` points at. Reach for this over
 * `recipeNameContract` when the value identifies the ROW-MAKER rather than the named plan a
 * `seed` step asks for. The character class is narrower than an ordinary name contract's, on
 * purpose: `rowRefContract` embeds this value verbatim as one segment of an ancestor path, so a
 * character this contract admitted and that syntax could not encode (`/`, `[`, `]`) would let a
 * legally declared ingredient build a `RowRef` that fails to parse.
 *
 * USAGE:
 * ingredientNameContract.parse('quest');
 * // Returns a branded IngredientName
 */
import { z } from 'zod';

export const ingredientNameContract = z
  .string()
  .min(1)
  .regex(
    /^[A-Za-z][A-Za-z0-9-]*$/u,
    'must start with a letter and hold only letters, digits and hyphens — the character set a RowRef segment can encode',
  )
  .brand<'IngredientName'>();

export type IngredientName = z.infer<typeof ingredientNameContract>;
