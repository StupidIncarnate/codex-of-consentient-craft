/**
 * PURPOSE: What siegelense reads after importing the recipes package's compiled output — every
 * recipe's name, description and inputs, as static data. Reach for this over calling a recipe: the
 * listing must never run anything. `runs` and `makes` are NOT stored here — they are computed off
 * a plan by `planRunsTransformer` and `planMakesTransformer`, because the listing prints the plan.
 *
 * USAGE:
 * recipeManifestContract.parse([{ recipeName: 'guild-mid-execution', description: 'one guild' }]);
 * // Returns RecipeManifest — an empty array means no recipes yet, not an installation problem
 */
import { z } from 'zod';
import { recipeDefContract } from '../recipe-def/recipe-def-contract';

export const recipeManifestContract = z.array(recipeDefContract).superRefine((entries, ctx) => {
  const seenAt = new Map<string, number>();

  entries.forEach((entry, index) => {
    const firstIndex = seenAt.get(entry.recipeName);
    if (firstIndex === undefined) {
      seenAt.set(entry.recipeName, index);
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `recipes at index ${firstIndex} and ${index} both declare the name '${entry.recipeName}'`,
      path: [index, 'recipeName'],
    });
  });
});

export type RecipeManifest = z.infer<typeof recipeManifestContract>;
