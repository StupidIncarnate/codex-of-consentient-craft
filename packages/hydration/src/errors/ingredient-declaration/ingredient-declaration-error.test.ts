import { IngredientDeclarationError } from './ingredient-declaration-error';

describe('IngredientDeclarationError', () => {
  describe('constructor()', () => {
    it.each([
      ['quest', 'declares no routes', 'ingredient "quest" declares no routes'],
      [
        'quest',
        'declares a write route with no copies target',
        'ingredient "quest" declares a write route with no copies target',
      ],
      [
        'session',
        'declares an extra named "set", which shadows a built-in verb',
        'ingredient "session" declares an extra named "set", which shadows a built-in verb',
      ],
    ])(
      'VALID: {ingredientName: %s, reason: %s} => names the ingredient and the reason',
      (ingredientName, reason, expectedMessage) => {
        const error = new IngredientDeclarationError({ ingredientName, reason });

        expect({ name: error.name, message: error.message }).toStrictEqual({
          name: 'IngredientDeclarationError',
          message: expectedMessage,
        });
      },
    );
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof IngredientDeclarationError => returns true', () => {
      const error = new IngredientDeclarationError({
        ingredientName: 'quest',
        reason: 'declares no routes',
      });

      expect(error instanceof IngredientDeclarationError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new IngredientDeclarationError({
        ingredientName: 'quest',
        reason: 'declares no routes',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
