/**
 * PURPOSE: Represents an error when `packages/hydration-recipes` exists but its `dist/index.js`
 * does not — the package has adopted the recipes convention and simply has not been compiled
 * since. Kept apart from `RecipesPackageMissingError` for the same reason that error names: an
 * adoption problem and a build problem point a person at two different commands, and collapsing
 * them into one message would send a person who already scaffolded the package back through
 * `dungeonmaster init` for nothing.
 *
 * USAGE:
 * throw new RecipesBuildMissingError({ distPath: '/repo/packages/hydration-recipes/dist/index.js' });
 * // Throws error naming the missing compiled file and the exact build command that produces it
 *
 * WHEN-TO-USE: From the broker locating the recipes package, once the package directory exists
 * but its `dist/index.js` is found absent, so a caller can `instanceof`-check it apart from every
 * other recipes-discovery failure.
 * WHEN-NOT-TO-USE: When the package directory itself is absent — that is
 * `RecipesPackageMissingError`. When `dist/index.js` exists but declares no recipes — that is not
 * an error at all; an empty listing is a real answer.
 */
export class RecipesBuildMissingError extends Error {
  public constructor({ distPath }: { distPath: string }) {
    super(
      `Recipes package built output not found at ${distPath}. Run "npm run build --workspace=@dungeonmaster/hydration-recipes" to build it.`,
    );
    this.name = 'RecipesBuildMissingError';
  }
}
