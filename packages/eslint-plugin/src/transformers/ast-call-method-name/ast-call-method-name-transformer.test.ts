import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { astCallMethodNameTransformer } from './ast-call-method-name-transformer';

describe('astCallMethodNameTransformer', () => {
  describe('a call on a member access', () => {
    it("VALID: {z.string().brand()} => returns 'brand'", () => {
      const node = CallExpressionStub({ code: 'f().brand();' });

      const result = astCallMethodNameTransformer({ node });

      expect(result).toBe('brand');
    });
  });

  describe('a call on anything else', () => {
    it('EMPTY: {run()} => returns null', () => {
      const node = CallExpressionStub({ code: 'run();' });

      const result = astCallMethodNameTransformer({ node });

      expect(result).toBe(null);
    });

    it("EMPTY: {object['key']()} => a computed property is not a method name", () => {
      const node = CallExpressionStub({ code: "object['key']();" });

      const result = astCallMethodNameTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
