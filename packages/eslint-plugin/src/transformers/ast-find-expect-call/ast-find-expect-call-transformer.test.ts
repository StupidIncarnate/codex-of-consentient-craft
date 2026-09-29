import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { astFindExpectCallTransformer } from './ast-find-expect-call-transformer';

describe('astFindExpectCallTransformer', () => {
  describe('direct expect chains', () => {
    it('VALID: {node: expect(x).toBe()} => returns expect CallExpression', () => {
      const code = 'expect(x).toBe();';
      const node = CallExpressionStub({ code });

      const result = astFindExpectCallTransformer({ node });

      expect(result?.range).toStrictEqual([0, 9]);
      expect(result?.callee.type).toBe('Identifier');
    });
  });

  describe('.not chains', () => {
    it('VALID: {node: expect(x).not.toBe()} => returns expect CallExpression', () => {
      const code = 'expect(x).not.toBe();';
      const node = CallExpressionStub({ code });

      const result = astFindExpectCallTransformer({ node });

      expect(result?.range).toStrictEqual([0, 9]);
      expect(result?.callee.type).toBe('Identifier');
    });
  });

  describe('.resolves chains', () => {
    it('VALID: {node: expect(x).resolves.toBe()} => returns expect CallExpression', () => {
      const code = 'expect(x).resolves.toBe();';
      const node = CallExpressionStub({ code });

      const result = astFindExpectCallTransformer({ node });

      expect(result?.range).toStrictEqual([0, 9]);
      expect(result?.callee.type).toBe('Identifier');
    });
  });

  describe('non-expect calls', () => {
    it('EMPTY: {node: foo.bar()} => returns null', () => {
      const node = CallExpressionStub({ code: 'foo.bar();' });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {node: non-MemberExpression callee} => returns null', () => {
      const node = CallExpressionStub({ code: 'fn();' });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {node: otherFn(x).toBe()} => returns null', () => {
      const node = CallExpressionStub({ code: 'otherFn().toBe();' });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
