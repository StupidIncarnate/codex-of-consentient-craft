import { RecipesPackageMissingError } from './recipes-package-missing-error';

describe('RecipesPackageMissingError', () => {
  describe('constructor()', () => {
    it('VALID: {packagePath} => names the searched path and dungeonmaster init as the fix', () => {
      const error = new RecipesPackageMissingError({
        packagePath: '/repo/packages/siegelense-recipes',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipesPackageMissingError',
        message:
          'No recipes package found at /repo/packages/siegelense-recipes. Run "dungeonmaster init" to scaffold packages/siegelense-recipes.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RecipesPackageMissingError => returns true', () => {
      const error = new RecipesPackageMissingError({
        packagePath: '/repo/packages/siegelense-recipes',
      });

      expect(error instanceof RecipesPackageMissingError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RecipesPackageMissingError({
        packagePath: '/repo/packages/siegelense-recipes',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
