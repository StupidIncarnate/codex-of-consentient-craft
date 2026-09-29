import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { astBrandLiteralTransformer } from './ast-brand-literal-transformer';

describe('astBrandLiteralTransformer', () => {
  describe('a brand call with a string type argument', () => {
    it("VALID: {typeArguments: ['Quest']} => returns the literal node", () => {
      const node = CallExpressionStub({ code: 'f<"Quest">();' });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toStrictEqual(LiteralStub({ code: 'f<"Quest">();' }));
    });
  });

  describe('a call with no string type argument', () => {
    it('EMPTY: {no type arguments} => returns null', () => {
      const node = CallExpressionStub({ code: 'f();' });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {a numeric literal type} => returns null', () => {
      const node = CallExpressionStub({ code: 'f<5>();' });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {a type reference argument} => returns null', () => {
      const node = CallExpressionStub({ code: 'f<Quest>();' });

      const result = astBrandLiteralTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
