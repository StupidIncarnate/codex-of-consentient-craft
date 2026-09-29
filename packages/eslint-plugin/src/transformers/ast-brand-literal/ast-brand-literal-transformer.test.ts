import { astBrandLiteralTransformer } from './ast-brand-literal-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astBrandLiteralTransformer', () => {
  describe('a brand call with a string type argument', () => {
    it("VALID: {typeArguments: ['Quest']} => returns the literal node", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        typeArguments: {
          type: TsestreeNodeType.TSTypeParameterInstantiation,
          params: [
            {
              type: TsestreeNodeType.TSLiteralType,
              literal: { type: TsestreeNodeType.Literal, value: 'Quest' },
            },
          ],
        },
      });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toStrictEqual({ type: 'Literal', value: 'Quest' });
    });

    it("VALID: {typeParameters: ['Quest']} => reads the older typeParameters field", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        typeParameters: {
          type: TsestreeNodeType.TSTypeParameterInstantiation,
          params: [
            {
              type: TsestreeNodeType.TSLiteralType,
              literal: { type: TsestreeNodeType.Literal, value: 'Quest' },
            },
          ],
        },
      });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toStrictEqual({ type: 'Literal', value: 'Quest' });
    });
  });

  describe('a call with no string type argument', () => {
    it('EMPTY: {no type arguments} => returns null', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {a numeric literal type} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        typeArguments: {
          type: TsestreeNodeType.TSTypeParameterInstantiation,
          params: [
            {
              type: TsestreeNodeType.TSLiteralType,
              literal: { type: TsestreeNodeType.Literal, value: 5 },
            },
          ],
        },
      });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {a type reference argument} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        typeArguments: {
          type: TsestreeNodeType.TSTypeParameterInstantiation,
          params: [
            {
              type: TsestreeNodeType.TSTypeReference,
              typeName: { type: TsestreeNodeType.Identifier, name: 'Quest' },
            },
          ],
        },
      });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
