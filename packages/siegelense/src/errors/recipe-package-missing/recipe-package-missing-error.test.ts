import { RecipePackageMissingError } from './recipe-package-missing-error';

describe('RecipePackageMissingError', () => {
  describe('the absent-package refusal', () => {
    it('ERROR: {expectedPath} => carries the class name and a message naming the path and dungeonmaster init', () => {
      const error = new RecipePackageMissingError({
        expectedPath: '/repo/packages/siegelense-recipes',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipePackageMissingError',
        message:
          'No recipes package at "/repo/packages/siegelense-recipes". That path is a convention, not a setting — every repo siegelense runs in has it, and an empty one is a real answer meaning "no recipes yet". Its absence means siegelense was never installed here: run dungeonmaster init.',
      });
    });

    it('ERROR: {expectedPath} => is an Error, so an unhandled throw still reports normally', () => {
      const error = new RecipePackageMissingError({
        expectedPath: '/repo/packages/siegelense-recipes',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
