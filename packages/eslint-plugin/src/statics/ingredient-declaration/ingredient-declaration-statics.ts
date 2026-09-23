/**
 * PURPOSE: The three signals `isIngredientDeclarationFileGuard` and
 * `isIngredientDeclarationCallGuard` check for an ingredient declaration, none of them sufficient
 * alone. `fileNameSuffixes` is the bare `<name>-ingredient.ts(x)` convention no real file uses,
 * because `enforce-project-structure` refuses that name inside `brokers/` and refuses a bare domain
 * folder outside it — kept for a consumer repo not bound by this architecture.
 * `brokerFileNameSuffixes` + `recipePackageNameSuffix` is what a file under THIS repo's own
 * `enforce-project-structure` actually looks like: `<name>-ingredient-broker.ts(x)`, inside an
 * `ingredient/` folder, inside a package named `*-recipes` (`hydration-recipes` today).
 * `declarationFunctionName` is the one signal that needs no path convention at all: the literal
 * name of the function every ingredient declaration calls, wherever the file lives.
 *
 * USAGE:
 * ingredientDeclarationStatics.fileNameSuffixes;
 * // Returns ['-ingredient.ts', '-ingredient.tsx']
 * ingredientDeclarationStatics.brokerFileNameSuffixes;
 * // Returns ['-ingredient-broker.ts', '-ingredient-broker.tsx']
 * ingredientDeclarationStatics.recipePackageNameSuffix;
 * // Returns '-recipes'
 * ingredientDeclarationStatics.declarationFunctionName;
 * // Returns 'ingredient'
 *
 * WHEN-TO-USE: Only `isIngredientDeclarationFileGuard` and `isIngredientDeclarationCallGuard`
 * should consume this.
 */
export const ingredientDeclarationStatics = {
  fileNameSuffixes: ['-ingredient.ts', '-ingredient.tsx'],
  brokerFileNameSuffixes: ['-ingredient-broker.ts', '-ingredient-broker.tsx'],
  recipePackageNameSuffix: '-recipes',
  declarationFunctionName: 'ingredient',
} as const;
