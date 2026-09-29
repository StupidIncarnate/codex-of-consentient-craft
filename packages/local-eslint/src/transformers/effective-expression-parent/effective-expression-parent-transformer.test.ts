import { ArrayExpressionStub } from '#gateway/npm/typescript-eslint__utils/array-expression/array-expression.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';

import { effectiveExpressionParentTransformer } from './effective-expression-parent-transformer';

describe('effectiveExpressionParentTransformer', () => {
  describe('missing node', () => {
    it('EMPTY: {} => returns null', () => {
      expect(effectiveExpressionParentTransformer({})).toBe(null);
    });

    it('EMPTY: {node: null} => returns null', () => {
      expect(effectiveExpressionParentTransformer({ node: null })).toBe(null);
    });

    it('EMPTY: {the Program root, which has no parent} => returns null', () => {
      expect(effectiveExpressionParentTransformer({ node: ProgramStub({ code: '' }) })).toBe(null);
    });
  });

  describe('opaque parent', () => {
    it('VALID: {node whose parent is a VariableDeclarator} => returns that VariableDeclarator', () => {
      const result = effectiveExpressionParentTransformer({
        node: ArrayExpressionStub({ code: 'const x = [];' }),
      });

      expect(result?.type).toBe('VariableDeclarator');
    });
  });

  describe('transparent wrappers', () => {
    it.each([
      ['TSAsExpression', 'const x = [] as T;'],
      ['TSSatisfiesExpression', 'const x = [] satisfies T;'],
      ['TSNonNullExpression', 'const x = []!;'],
    ] as const)(
      "VALID: {node wrapped in %s} => returns the wrapper's own parent",
      (_wrapperType, code) => {
        const result = effectiveExpressionParentTransformer({
          node: ArrayExpressionStub({ code }),
        });

        expect(result?.type).toBe('VariableDeclarator');
      },
    );

    it('VALID: {node wrapped in two nested assertions} => skips both and returns the MemberExpression', () => {
      const result = effectiveExpressionParentTransformer({
        node: ArrayExpressionStub({ code: '([] as T)!.includes;' }),
      });

      expect(result?.type).toBe('MemberExpression');
    });

    it('EDGE: {node wrapped in an assertion at statement level} => returns the ExpressionStatement', () => {
      expect(
        effectiveExpressionParentTransformer({
          node: ArrayExpressionStub({ code: '[] as unknown' }),
        })?.type,
      ).toBe('ExpressionStatement');
    });
  });
});
