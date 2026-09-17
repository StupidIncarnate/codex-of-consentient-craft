import { HydrationNestedIngredientUnregisteredError } from './hydration-nested-ingredient-unregistered-error';

describe('HydrationNestedIngredientUnregisteredError', () => {
  describe('constructor()', () => {
    it('VALID: {recipeName, ingredientName, registeredIngredientNames: [quest]} => names the recipe, the unresolvable ingredient and what is registered', () => {
      const error = new HydrationNestedIngredientUnregisteredError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        registeredIngredientNames: ['quest'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationNestedIngredientUnregisteredError',
        message:
          'recipe "drop-riftcarver-item": a nested op inside a filter names ingredient "operation", which this run\'s ingredients do not include. Registered ingredient names: quest',
      });
    });

    it('EDGE: {registeredIngredientNames: [quest, guild]} => lists every ingredient name this run does hold', () => {
      const error = new HydrationNestedIngredientUnregisteredError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'session',
        registeredIngredientNames: ['quest', 'guild'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationNestedIngredientUnregisteredError',
        message:
          'recipe "drop-riftcarver-item": a nested op inside a filter names ingredient "session", which this run\'s ingredients do not include. Registered ingredient names: quest, guild',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationNestedIngredientUnregisteredError => returns true', () => {
      const error = new HydrationNestedIngredientUnregisteredError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        registeredIngredientNames: ['quest'],
      });

      expect(error instanceof HydrationNestedIngredientUnregisteredError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationNestedIngredientUnregisteredError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        registeredIngredientNames: ['quest'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
