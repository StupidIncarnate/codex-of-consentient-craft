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
