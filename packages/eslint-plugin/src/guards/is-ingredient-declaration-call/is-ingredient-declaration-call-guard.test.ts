import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isIngredientDeclarationCallGuard } from './is-ingredient-declaration-call-guard';

describe('isIngredientDeclarationCallGuard', () => {
  describe('matching calls', () => {
    it('VALID: {CallExpression: ingredient({...})} => returns true', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({ type: 'Identifier', name: 'ingredient' }),
        arguments: [TsestreeStub({ type: 'ObjectExpression' })],
      });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(true);
    });
  });

  describe('non-matching calls', () => {
    it('INVALID: {CallExpression: dm.ingredient({...})} => returns false', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({
          type: 'MemberExpression',
          object: TsestreeStub({ type: 'Identifier', name: 'dm' }),
          property: TsestreeStub({ type: 'Identifier', name: 'ingredient' }),
        }),
        arguments: [TsestreeStub({ type: 'ObjectExpression' })],
      });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });

    it('INVALID: {CallExpression: a differently-named function} => returns false', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({ type: 'Identifier', name: 'dmIngredient' }),
        arguments: [TsestreeStub({ type: 'ObjectExpression' })],
      });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });

    it('INVALID: {CallExpression: ingredient() with no arguments} => returns false', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: TsestreeStub({ type: 'Identifier', name: 'ingredient' }),
        arguments: [],
      });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });

    it('INVALID: {non-CallExpression node} => returns false', () => {
      const node = TsestreeStub({ type: 'Identifier', name: 'ingredient' });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      expect(isIngredientDeclarationCallGuard({})).toBe(false);
    });

    it('EMPTY: {CallExpression with no callee} => returns false', () => {
      const node = TsestreeStub({
        type: 'CallExpression',
        callee: undefined,
        arguments: [TsestreeStub({ type: 'ObjectExpression' })],
      });

      expect(isIngredientDeclarationCallGuard({ node })).toBe(false);
    });
  });
});
