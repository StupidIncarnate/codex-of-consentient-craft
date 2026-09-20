import { RecipesBuildMissingError } from './recipes-build-missing-error';

describe('RecipesBuildMissingError', () => {
  describe('constructor()', () => {
    it('VALID: {distPath} => names the missing compiled file and the exact build command', () => {
      const error = new RecipesBuildMissingError({
        distPath: '/repo/packages/hydration-recipes/dist/index.js',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipesBuildMissingError',
        message:
          'Recipes package built output not found at /repo/packages/hydration-recipes/dist/index.js. Run "npm run build --workspace=@dungeonmaster/hydration-recipes" to build it.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RecipesBuildMissingError => returns true', () => {
      const error = new RecipesBuildMissingError({
        distPath: '/repo/packages/hydration-recipes/dist/index.js',
      });

      expect(error instanceof RecipesBuildMissingError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RecipesBuildMissingError({
        distPath: '/repo/packages/hydration-recipes/dist/index.js',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
