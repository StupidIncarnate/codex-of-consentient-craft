/**
 * PURPOSE: The filesystem and export-name convention `siegelense` and a repo's own recipes package
 * independently agree on, so the tool can find and read the package's compiled output without
 * importing it. Lives here, not in either package, because `siegelense` may import neither producer
 * package (`siegelense-recipes.md`'s "Three packages, and what may cross between them" table —
 * "neither of the others") and putting the tool in the recipes package's dependency graph is exactly
 * the coupling the three-package split exists to prevent — `@dungeonmaster/shared` is the one
 * package both already depend on and neither owns.
 *
 * USAGE:
 * recipesConventionStatics.package.dirName;
 * // Returns 'hydration-recipes'
 *
 * recipesConventionStatics.exports.manifest;
 * // Returns 'recipesManifest'
 */

export const recipesConventionStatics = {
  package: {
    workspaceDirName: 'packages',
    dirName: 'hydration-recipes',
  },
  entry: {
    distRelativePath: 'dist/index.js',
  },
  exports: {
    manifest: 'recipesManifest',
    listing: 'RecipesListingResponder',
    seed: 'RecipesSeedResponder',
  },
} as const;
