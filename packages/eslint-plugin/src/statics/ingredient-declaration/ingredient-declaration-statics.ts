/**
 * PURPOSE: The filename convention `isIngredientDeclarationFileGuard` matches against. There is no
 * `ingredients/` folder type in this repo's architecture, so an ingredient is identified only by
 * following the same "the entry file's name is its folder path plus the suffix" convention every
 * other folder type already uses here — a bet on a naming scheme `hydration-recipes` has not yet
 * landed on disk, not something observed there.
 *
 * USAGE:
 * ingredientDeclarationStatics.fileNameSuffixes;
 * // Returns ['-ingredient.ts', '-ingredient.tsx']
 *
 * WHEN-TO-USE: Only `isIngredientDeclarationFileGuard` should consume this.
 */
export const ingredientDeclarationStatics = {
  fileNameSuffixes: ['-ingredient.ts', '-ingredient.tsx'],
} as const;
