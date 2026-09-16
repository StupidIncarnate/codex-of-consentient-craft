/**
 * PURPOSE: Answers whether a filename follows the `<name>-ingredient.ts(x)` entry-file convention
 * this rule set scopes to. There is no `ingredients/` folder type in the architecture, so this
 * filename suffix is the only signal `ban-dom-handles-in-ingredients` and
 * `ban-nondeterminism-in-ingredients` have to identify an ingredient declaration by. A consumer
 * repo, or a chunk that lands ingredients under a different name, is invisible to it.
 *
 * USAGE:
 * isIngredientDeclarationFileGuard({ filename: 'packages/hydration-recipes/src/quest/quest-ingredient.ts' });
 * // Returns true
 */
import { ingredientDeclarationStatics } from '../../statics/ingredient-declaration/ingredient-declaration-statics';

export const isIngredientDeclarationFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }
  return ingredientDeclarationStatics.fileNameSuffixes.some((suffix) => filename.endsWith(suffix));
};
