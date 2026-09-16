import { HydrationUnlinkedRowError } from './hydration-unlinked-row-error';

describe('HydrationUnlinkedRowError', () => {
  describe('constructor()', () => {
    it('VALID: {ingredientName: "quest", missingParentName: "guild"} => names the recipe, the ingredient and the missing ancestor', () => {
      const error = new HydrationUnlinkedRowError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        missingParentName: 'guild',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationUnlinkedRowError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" needs a "guild" ancestor to fill its link, but this row has none — including a row added at the top level, which the type system allows freely',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationUnlinkedRowError => returns true', () => {
      const error = new HydrationUnlinkedRowError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        missingParentName: 'guild',
      });

      expect(error instanceof HydrationUnlinkedRowError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationUnlinkedRowError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        missingParentName: 'guild',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
