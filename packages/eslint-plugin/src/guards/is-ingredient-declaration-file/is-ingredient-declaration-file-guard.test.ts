import { isIngredientDeclarationFileGuard } from './is-ingredient-declaration-file-guard';

describe('isIngredientDeclarationFileGuard', () => {
  describe('matching filenames', () => {
    it('VALID: {filename: a *-ingredient.ts path} => returns true', () => {
      const result = isIngredientDeclarationFileGuard({
        filename: '/repo/packages/hydration-recipes/src/quest/quest-ingredient.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: a *-ingredient.tsx path} => returns true', () => {
      const result = isIngredientDeclarationFileGuard({
        filename: '/repo/packages/hydration-recipes/src/quest/quest-ingredient.tsx',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: a real *-ingredient-broker.ts path in a *-recipes package} => returns true', () => {
      const result = isIngredientDeclarationFileGuard({
        filename:
          '/repo/packages/hydration-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: a real *-ingredient-broker.tsx path in a *-recipes package} => returns true', () => {
      const result = isIngredientDeclarationFileGuard({
        filename:
          '/repo/packages/hydration-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.tsx',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: the renamed hydration-recipes package} => returns true', () => {
      const result = isIngredientDeclarationFileGuard({
        filename:
          '/repo/packages/hydration-recipes/src/brokers/guild/ingredient/guild-ingredient-broker.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('non-matching filenames', () => {
    it('INVALID: {filename: a -broker.ts path} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({
        filename: '/repo/packages/hydration-recipes/src/quest/quest-broker.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: an ingredient test file} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({
        filename: '/repo/packages/hydration-recipes/src/quest/quest-ingredient.test.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: a path merely containing "ingredient"} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({
        filename:
          '/repo/packages/hydration-recipes/src/ingredient-notes/ingredient-notes-statics.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: a route broker beside a real ingredient} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({
        filename:
          '/repo/packages/hydration-recipes/src/brokers/quest/write-route/quest-write-route-broker.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: *-ingredient-broker.ts outside an ingredient/ folder} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({
        filename: '/repo/packages/hydration-recipes/src/brokers/quest/quest-ingredient-broker.ts',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: *-ingredient-broker.ts in an ingredient/ folder outside a *-recipes package} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({
        filename:
          '/repo/packages/hydration/src/brokers/quest/ingredient/quest-ingredient-broker.ts',
      });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {filename: empty string} => returns false', () => {
      const result = isIngredientDeclarationFileGuard({ filename: '' });

      expect(result).toBe(false);
    });
  });
});
