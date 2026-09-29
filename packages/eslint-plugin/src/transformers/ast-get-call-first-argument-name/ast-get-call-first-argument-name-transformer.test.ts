import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { astGetCallFirstArgumentNameTransformer } from './ast-get-call-first-argument-name-transformer';

describe('astGetCallFirstArgumentNameTransformer', () => {
  describe('valid calls with identifier arguments', () => {
    it("VALID: {node: jest.spyOn(Date, 'now')} => returns 'Date'", () => {
      const node = CallExpressionStub({ code: 'jest.spyOn(Date, "now");' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('Date');
    });

    it("VALID: {node: jest.spyOn(axios, 'get')} => returns 'axios'", () => {
      const node = CallExpressionStub({ code: 'jest.spyOn(axios, "get");' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('axios');
    });

    it("VALID: {node: someFunction(myVar)} => returns 'myVar'", () => {
      const node = CallExpressionStub({ code: 'someFunction(myVar);' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('myVar');
    });

    it("VALID: {node: jest.spyOn(console, 'log')} => returns 'console'", () => {
      const node = CallExpressionStub({ code: 'jest.spyOn(console, "log");' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('console');
    });
  });

  describe('calls with non-identifier first arguments', () => {
    it("EDGE: {node: jest.spyOn('literal', 'method')} => returns null", () => {
      const node = CallExpressionStub({ code: 'jest.spyOn("literal", "method");' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe(null);
    });

    it('EDGE: {node: someFunction(123)} => returns null', () => {
      const node = CallExpressionStub({ code: 'someFunction(123);' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe(null);
    });

    it('EDGE: {node: someFunction(obj.property)} => returns null', () => {
      const node = CallExpressionStub({ code: 'someFunction(obj.property);' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = astGetCallFirstArgumentNameTransformer({});

      expect(result).toBe(null);
    });

    it('EMPTY: {node: undefined} => returns null', () => {
      const result = astGetCallFirstArgumentNameTransformer({});

      expect(result).toBe(null);
    });

    it('EMPTY: {node: CallExpression with no arguments} => returns null', () => {
      const node = CallExpressionStub({ code: 'someFunction();' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe(null);
    });

    it('EDGE: {node: non-CallExpression} => returns null', () => {
      const node = IdentifierStub({ code: 'someVar;' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe(null);
    });
  });

  describe('multiple arguments', () => {
    it("VALID: {node: call(first, second, third)} => returns 'first'", () => {
      const node = CallExpressionStub({ code: 'call(first, second, third);' });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('first');
    });
  });
});
