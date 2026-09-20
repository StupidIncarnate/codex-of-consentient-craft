/**
 * PURPOSE: Represents an error when a repo's compiled recipes entry does not export
 * `recipesConventionStatics.exports.listing` as a function — the export absent entirely
 * (`found` is `"undefined"`) or present as the wrong type. Distinct from
 * `RecipesBuildMissingError`: that one fires when the compiled file itself is absent, this one
 * fires once the file has loaded, because a built package can still be malformed.
 *
 * USAGE:
 * throw new RecipesListingExportInvalidError({
 *   entryPath: '/repo/packages/hydration-recipes/dist/index.js',
 *   exportName: 'RecipesListingResponder',
 *   found: 'undefined',
 * });
 * // Throws error naming the entry path, the export name, and what was found instead of a function
 *
 * WHEN-TO-USE: From the broker that has already imported the compiled entry, once the export the
 * recipes convention requires resolves to anything other than a function, so a caller can
 * `instanceof`-check it apart from every other recipes-discovery failure.
 * WHEN-NOT-TO-USE: When the export IS a function — reading proceeds and never throws this.
 */
export class RecipesListingExportInvalidError extends Error {
  public constructor({
    entryPath,
    exportName,
    found,
  }: {
    entryPath: string;
    exportName: string;
    found: string;
  }) {
    super(
      `${entryPath} does not export "${exportName}" as a function (found ${found}). ` +
        `If packages/hydration-recipes/index.ts does not export "${exportName}", add it there. If it already does, the compiled entry is stale — run "npm run build --workspace=@dungeonmaster/hydration-recipes" to rebuild it.`,
    );
    this.name = 'RecipesListingExportInvalidError';
  }
}
