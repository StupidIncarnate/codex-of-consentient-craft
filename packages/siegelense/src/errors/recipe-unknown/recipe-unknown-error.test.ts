import { RecipeUnknownError } from './recipe-unknown-error';

describe('RecipeUnknownError', () => {
  describe('constructor()', () => {
    it('VALID: {recipeName: "nope", known: three recipe names} => names the unknown recipe and all three known recipes', () => {
      const error = new RecipeUnknownError({
        recipeName: 'nope',
        known: ['guild-mid-execution', 'quest-advances-one-step', 'session-with-nested-chain'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeUnknownError',
        message:
          'Unknown recipe "nope". Known recipes: guild-mid-execution, quest-advances-one-step, session-with-nested-chain.',
      });
    });

    it('EMPTY: {known: []} => says no recipes are declared yet, rather than trailing off after a colon', () => {
      const error = new RecipeUnknownError({ recipeName: 'nope', known: [] });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeUnknownError',
        message: 'Unknown recipe "nope". Known recipes: (none — no recipes are declared yet).',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RecipeUnknownError => returns true', () => {
      const error = new RecipeUnknownError({ recipeName: 'nope', known: ['guild-mid-execution'] });

      expect(error instanceof RecipeUnknownError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RecipeUnknownError({ recipeName: 'nope', known: ['guild-mid-execution'] });

      expect(error instanceof Error).toBe(true);
    });
  });
});
