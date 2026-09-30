/**
 * PURPOSE: Parses the whole `recipes {}` answer — one row per recipe the compiled recipes package
 * exports, each already proven safe on its own by `recipeListingEntryContract`. Refuses two entries
 * sharing one `recipeName`, independently of `@dungeonmaster/hydration`'s `recipeManifestContract`
 * duplicate check, for the same reason `recipeNameContract` is independently declared in this
 * package (`siegelense-recipes.md`'s "Three packages, and what may cross between them" table —
 * "neither of the others") — the listing is what `seed` and the bare `recipes` call's default human
 * view both pick a recipe from, and two rows sharing a name make the pick ambiguous.
 *
 * USAGE:
 * recipesListingContract.parse([]);
 * // Returns RecipesListing — an empty array means "no recipes declared yet", not an installation
 * // problem
 */

import { z } from '#gateway/npm/zod';

import { recipeListingEntryContract } from '../recipe-listing-entry/recipe-listing-entry-contract';

export const recipesListingContract = z
  .array(recipeListingEntryContract)
  .superRefine((entries, ctx) => {
    const seenAt = new Map<string, number>();

    entries.forEach((entry, index) => {
      const position = index;
      const firstPosition = seenAt.get(entry.recipeName);
      if (firstPosition === undefined) {
        seenAt.set(entry.recipeName, position);
        return;
      }
      ctx.addIssue({
        code: 'custom',
        message: `recipes at index ${firstPosition} and ${position} both declare the name '${entry.recipeName}'`,
        path: [index, 'recipeName'],
      });
    });
  });

export type RecipesListing = z.infer<typeof recipesListingContract>;
