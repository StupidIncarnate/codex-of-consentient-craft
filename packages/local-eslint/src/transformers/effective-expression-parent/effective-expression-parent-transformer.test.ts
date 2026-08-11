import { TsestreeStub, TsestreeNodeType } from '@dungeonmaster/eslint-plugin';

import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';
import { effectiveExpressionParentTransformer } from './effective-expression-parent-transformer';

describe('effectiveExpressionParentTransformer', () => {
  describe('missing node', () => {
    it('EMPTY: {} => returns null', () => {
      expect(effectiveExpressionParentTransformer({})).toBe(null);
    });

    it('EMPTY: {node: null} => returns null', () => {
      expect(effectiveExpressionParentTransformer({ node: null })).toBe(null);
    });

    it('EMPTY: {node with parent: null} => returns null', () => {
      expect(
        effectiveExpressionParentTransformer({
          node: TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: null }),
        }),
      ).toBe(null);
    });
  });

  describe('opaque parent', () => {
    it('VALID: {node whose parent is a VariableDeclarator} => returns that VariableDeclarator', () => {
      const result = effectiveExpressionParentTransformer({
        node: TsestreeStub({
          type: TsestreeNodeType.ArrayExpression,
          parent: { type: TsestreeNodeType.VariableDeclarator },
        }),
      });

      expect(result?.type).toBe('VariableDeclarator');
    });
  });

  describe('transparent wrappers', () => {
    it.each(packageNameLiteralStatics.transparentExpressionWrapperTypes)(
      "VALID: {node wrapped in %s} => returns the wrapper's own parent",
      (wrapperType) => {
        const result = effectiveExpressionParentTransformer({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: {
              type: wrapperType,
              parent: { type: TsestreeNodeType.VariableDeclarator },
            },
          }),
        });

        expect(result?.type).toBe('VariableDeclarator');
      },
    );

    it('VALID: {node wrapped in two nested assertions} => skips both and returns the MemberExpression', () => {
      const result = effectiveExpressionParentTransformer({
        node: TsestreeStub({
          type: TsestreeNodeType.ArrayExpression,
          parent: {
            type: TsestreeNodeType.TSAsExpression,
            parent: {
              type: TsestreeNodeType.TSNonNullExpression,
              parent: { type: TsestreeNodeType.MemberExpression },
            },
          },
        }),
      });

      expect(result?.type).toBe('MemberExpression');
    });

    it('EDGE: {node wrapped in an assertion with no further parent} => returns null', () => {
      expect(
        effectiveExpressionParentTransformer({
          node: TsestreeStub({
            type: TsestreeNodeType.ArrayExpression,
            parent: { type: TsestreeNodeType.TSAsExpression, parent: null },
          }),
        }),
      ).toBe(null);
    });
  });
});
