/**
 * PURPOSE: Parses the whole `recipes {}` answer — one row per recipe the compiled recipes package
 * exports, each already proven safe on its own by `recipeListingEntryContract`. Refuses two entries
 * sharing one `recipeName`, independently of `@dungeonmaster/hydration`'s `recipeManifestContract`
 * duplicate check, for the same reason `recipeNameContract` is independently declared in this
 * package (`siegelense-recipes.md`'s "Three packages, and what may cross between them" table —
 * "neither of the others") — the listing is what `seed` and `recipes --human` both pick a recipe
 * from, and two rows sharing a name make the pick ambiguous.
 *
 * USAGE:
 * recipesListingContract.parse([]);
 * // Returns RecipesListing — an empty array means "no recipes declared yet", not an installation
 * // problem
 */

import { z } from 'zod';

import { arrayIndexContract } from '@dungeonmaster/shared/contracts';
import type { ArrayIndex } from '@dungeonmaster/shared/contracts';

import { recipeListingEntryContract } from '../recipe-listing-entry/recipe-listing-entry-contract';
import type { RecipeName } from '../recipe-name/recipe-name-contract';

export const recipesListingContract = z
  .array(recipeListingEntryContract)
  .superRefine((entries, ctx) => {
    const seenAt = new Map<RecipeName, ArrayIndex>();

    entries.forEach((entry, index) => {
      const position = arrayIndexContract.parse(index);
      const firstPosition = seenAt.get(entry.recipeName);
      if (firstPosition === undefined) {
        seenAt.set(entry.recipeName, position);
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `recipes at index ${firstPosition} and ${position} both declare the name '${entry.recipeName}'`,
        path: [index, 'recipeName'],
      });
    });
  });

export type RecipesListing = z.infer<typeof recipesListingContract>;
