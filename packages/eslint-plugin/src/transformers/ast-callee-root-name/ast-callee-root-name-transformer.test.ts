import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { astCalleeRootNameTransformer } from './ast-callee-root-name-transformer';

describe('astCalleeRootNameTransformer', () => {
  describe('plain identifier callees', () => {
    it("VALID: {node: describe(...)} => returns 'describe'", () => {
      const node = CallExpressionStub({ code: 'describe();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('describe');
    });

    it("VALID: {node: it(...)} => returns 'it'", () => {
      const node = CallExpressionStub({ code: 'it();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('it');
    });

    it("VALID: {node: test(...)} => returns 'test'", () => {
      const node = CallExpressionStub({ code: 'test();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('test');
    });
  });

  describe('member expression callees', () => {
    it("VALID: {node: describe.each(...)} => returns 'describe'", () => {
      const node = CallExpressionStub({ code: 'describe.each();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('describe');
    });

    it("VALID: {node: it.only(...)} => returns 'it'", () => {
      const node = CallExpressionStub({ code: 'it.only();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('it');
    });

    it("VALID: {node: test.skip(...)} => returns 'test'", () => {
      const node = CallExpressionStub({ code: 'test.skip();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('test');
    });
  });

  describe('double call expression callees', () => {
    it("VALID: {node: describe.each(table)('name', fn)} => returns 'describe'", () => {
      const node = CallExpressionStub({ code: 'describe.each()();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('describe');
    });

    it("VALID: {node: it.each(table)('name', fn)} => returns 'it'", () => {
      const node = CallExpressionStub({ code: 'it.each()();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('it');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = astCalleeRootNameTransformer({});

      expect(result).toBe(null);
    });

    it('EMPTY: {node: omitted} => returns null', () => {
      const result = astCalleeRootNameTransformer({});

      expect(result).toBe(null);
    });

    it('EDGE: {node: callee is Literal} => returns null', () => {
      const node = CallExpressionStub({ code: '"foo"();' });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
