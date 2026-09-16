/**
 * PURPOSE: Represents an error when `<repoRoot>/packages/siegelense-recipes` does not exist on
 * disk — the repo has never run the scaffold that creates it. Kept apart from
 * `RecipesBuildMissingError`: an absent package is a repo that has not adopted the recipes
 * convention at all, while a present-but-unbuilt one has adopted it and only needs compiling —
 * collapsing the two into one message would send a person who already scaffolded the package back
 * through `dungeonmaster init` for nothing.
 *
 * USAGE:
 * throw new RecipesPackageMissingError({ packagePath: '/repo/packages/siegelense-recipes' });
 * // Throws error naming the path that was searched and dungeonmaster init as what creates it
 *
 * WHEN-TO-USE: From the broker locating the recipes package, once the package directory is found
 * absent, so a caller can `instanceof`-check it apart from every other recipes-discovery failure.
 * WHEN-NOT-TO-USE: When the directory exists but its `dist/index.js` does not — that is
 * `RecipesBuildMissingError`.
 */
export class RecipesPackageMissingError extends Error {
  public constructor({ packagePath }: { packagePath: string }) {
    super(
      `No recipes package found at ${packagePath}. Run "dungeonmaster init" to scaffold packages/siegelense-recipes.`,
    );
    this.name = 'RecipesPackageMissingError';
  }
}
