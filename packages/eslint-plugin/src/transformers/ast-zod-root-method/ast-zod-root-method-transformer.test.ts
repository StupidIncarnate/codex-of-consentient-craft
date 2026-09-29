import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { astZodRootMethodTransformer } from './ast-zod-root-method-transformer';

describe('astZodRootMethodTransformer', () => {
  describe('a chain that starts on z', () => {
    it("VALID: {z.string().min(1).brand()} => returns 'string'", () => {
      const node = CallExpressionStub({ code: 'z.string().min(1).brand();' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('string');
    });

    it("VALID: {z.object({}).brand()} => returns 'object'", () => {
      const node = CallExpressionStub({ code: 'z.object({}).brand();' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('object');
    });

    it("VALID: {z.enum([]).brand()} => returns 'enum'", () => {
      const node = CallExpressionStub({ code: 'z.enum([]).brand();' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('enum');
    });

    it("VALID: {z.object({}).extend({}).brand()} => returns 'derive'", () => {
      const node = CallExpressionStub({ code: 'z.object({}).extend({}).brand();' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('derive');
    });
  });

  describe('a chain that starts elsewhere', () => {
    it("VALID: {userContract.pick({}).brand()} => returns 'derive'", () => {
      const node = CallExpressionStub({ code: 'userContract.pick({}).brand();' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe('derive');
    });

    it('EMPTY: {userContract.optional()} => returns null', () => {
      const node = CallExpressionStub({ code: 'userContract.optional();' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {questContract.shape.id.min(5)} => returns null', () => {
      const node = CallExpressionStub({ code: 'questContract.shape.id.min(5);' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {a node that is not a call} => returns null', () => {
      const node = IdentifierStub({ code: 'z;' });

      const result = astZodRootMethodTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
