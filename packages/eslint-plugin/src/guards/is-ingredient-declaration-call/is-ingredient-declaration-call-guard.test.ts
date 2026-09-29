import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isIngredientDeclarationCallGuard } from './is-ingredient-declaration-call-guard';

describe('isIngredientDeclarationCallGuard', () => {
  describe('matching calls', () => {
    it('VALID: {CallExpression: ingredient({...})} => returns true', () => {
      const node = CallExpressionStub({ code: 'ingredient({  });' });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(true);
    });
  });

  describe('non-matching calls', () => {
    it('INVALID: {CallExpression: dm.ingredient({...})} => returns false', () => {
      const node = CallExpressionStub({ code: 'dm.ingredient({  });' });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });

    it('INVALID: {CallExpression: a differently-named function} => returns false', () => {
      const node = CallExpressionStub({ code: 'dmIngredient({  });' });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });

    it('INVALID: {CallExpression: ingredient() with no arguments} => returns false', () => {
      const node = CallExpressionStub({ code: 'ingredient();' });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });

    it('INVALID: {non-CallExpression node} => returns false', () => {
      const node = IdentifierStub({ code: 'ingredient;' });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isIngredientDeclarationCallGuard({})).toBe(false);
    });
  });
});
