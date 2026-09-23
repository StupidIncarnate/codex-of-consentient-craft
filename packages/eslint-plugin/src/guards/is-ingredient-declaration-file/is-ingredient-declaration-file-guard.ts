/**
 * PURPOSE: Answers whether a FILEPATH identifies an ingredient declaration by location alone —
 * the bare `<name>-ingredient.ts(x)` entry-file convention no real file uses (`enforce-project-
 * structure` refuses that name inside `brokers/` and refuses a bare domain folder outside it), OR
 * this repo's own real shape: `<name>-ingredient-broker.ts(x)` inside an `ingredient/` folder of a
 * package named `*-recipes`. Neither is the truthful signal — a file can declare an ingredient
 * under any name, in any package, by CALLING the framework's declaration function — see
 * `isIngredientDeclarationCallGuard` for that one. This guard exists for the two rules to skip a
 * full traversal on a file whose PATH alone already answers the question, and to catch a
 * declaration reached only through re-exports, where no call in the file itself would show it.
 *
 * USAGE:
 * isIngredientDeclarationFileGuard({ filename: 'packages/hydration-recipes/src/quest/quest-ingredient.ts' });
 * // Returns true — bare convention
 * isIngredientDeclarationFileGuard({ filename: '/repo/packages/hydration-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.ts' });
 * // Returns true — this repo's real convention
 * isIngredientDeclarationFileGuard({ filename: '/repo/packages/hydration-recipes/src/brokers/quest/write-route/quest-write-route-broker.ts' });
 * // Returns false — a route broker the ingredient's config merely references, not a declaration
 */
import { ingredientDeclarationStatics } from '../../statics/ingredient-declaration/ingredient-declaration-statics';

export const isIngredientDeclarationFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  const matchesBareIngredientFilename = ingredientDeclarationStatics.fileNameSuffixes.some(
    (suffix) => filename.endsWith(suffix),
  );
  if (matchesBareIngredientFilename) {
    return true;
  }

  const matchesIngredientBrokerFilename = ingredientDeclarationStatics.brokerFileNameSuffixes.some(
    (suffix) => filename.endsWith(suffix),
  );
  if (!matchesIngredientBrokerFilename || !filename.includes('/ingredient/')) {
    return false;
  }

  const [, pathAfterPackages] = filename.split('/packages/');
  const [packageName] = pathAfterPackages?.split('/') ?? [];
  return Boolean(packageName?.endsWith(ingredientDeclarationStatics.recipePackageNameSuffix));
};
