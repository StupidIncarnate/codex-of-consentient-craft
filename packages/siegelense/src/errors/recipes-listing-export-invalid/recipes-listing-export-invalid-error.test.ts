import { RecipesListingExportInvalidError } from './recipes-listing-export-invalid-error';

describe('RecipesListingExportInvalidError', () => {
  describe('constructor()', () => {
    it('VALID: {entryPath, exportName, found: "undefined"} => names the entry, export, and the missing export', () => {
      const error = new RecipesListingExportInvalidError({
        entryPath: '/repo/packages/hydration-recipes/dist/index.js',
        exportName: 'recipesListingBuildBroker',
        found: 'undefined',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipesListingExportInvalidError',
        message:
          '/repo/packages/hydration-recipes/dist/index.js does not export "recipesListingBuildBroker" as a function (found undefined). If packages/hydration-recipes/index.ts does not export "recipesListingBuildBroker", add it there. If it already does, the compiled entry is stale — run "npm run build --workspace=@dungeonmaster/hydration-recipes" to rebuild it.',
      });
    });

    it('VALID: {entryPath, exportName, found: "string"} => names the entry, export, and the wrong type found', () => {
      const error = new RecipesListingExportInvalidError({
        entryPath: '/repo/packages/hydration-recipes/dist/index.js',
        exportName: 'recipesListingBuildBroker',
        found: 'string',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipesListingExportInvalidError',
        message:
          '/repo/packages/hydration-recipes/dist/index.js does not export "recipesListingBuildBroker" as a function (found string). If packages/hydration-recipes/index.ts does not export "recipesListingBuildBroker", add it there. If it already does, the compiled entry is stale — run "npm run build --workspace=@dungeonmaster/hydration-recipes" to rebuild it.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RecipesListingExportInvalidError => returns true', () => {
      const error = new RecipesListingExportInvalidError({
        entryPath: '/repo/packages/hydration-recipes/dist/index.js',
        exportName: 'recipesListingBuildBroker',
        found: 'undefined',
      });

      expect(error instanceof RecipesListingExportInvalidError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RecipesListingExportInvalidError({
        entryPath: '/repo/packages/hydration-recipes/dist/index.js',
        exportName: 'recipesListingBuildBroker',
        found: 'undefined',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
