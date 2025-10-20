import { astGetCallFirstArgumentNameTransformer } from './ast-get-call-first-argument-name-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astGetCallFirstArgumentNameTransformer', () => {
  describe('valid calls with identifier arguments', () => {
    it("VALID: {node: jest.spyOn(Date, 'now')} => returns 'Date'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'jest' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'spyOn' }),
        }),
        arguments: [
          TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'Date' }),
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'now' }),
        ],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('Date');
    });

    it("VALID: {node: jest.spyOn(axios, 'get')} => returns 'axios'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'jest' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'spyOn' }),
        }),
        arguments: [
          TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'axios' }),
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'get' }),
        ],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('axios');
    });

    it("VALID: {node: someFunction(myVar)} => returns 'myVar'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'myVar' })],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('myVar');
    });

    it("VALID: {node: jest.spyOn(console, 'log')} => returns 'console'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'jest' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'spyOn' }),
        }),
        arguments: [
          TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'console' }),
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'log' }),
        ],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('console');
    });
  });

  describe('calls with non-identifier first arguments', () => {
    it("EDGE: {node: jest.spyOn('literal', 'method')} => returns null", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'jest' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'spyOn' }),
        }),
        arguments: [
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'literal' }),
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'method' }),
        ],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });

    it('EDGE: {node: someFunction(123)} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Literal, value: 123 })],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });

    it('EDGE: {node: someFunction(obj.property)} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: [
          TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'obj' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'property' }),
          }),
        ],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = astGetCallFirstArgumentNameTransformer({});

      expect(result).toBeNull();
    });

    it('EMPTY: {node: undefined} => returns null', () => {
      const result = astGetCallFirstArgumentNameTransformer({});

      expect(result).toBeNull();
    });

    it('EMPTY: {node: CallExpression with no arguments} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: [],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });

    it('EMPTY: {node: CallExpression with undefined arguments} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: undefined,
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });

    it('EDGE: {node: Identifier with no name} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: undefined })],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });

    it('EDGE: {node: Identifier with empty string name} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'someFunction' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: '' })],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });

    it('EDGE: {node: non-CallExpression} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'someVar',
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBeNull();
    });
  });

  describe('multiple arguments', () => {
    it("VALID: {node: call(first, second, third)} => returns 'first'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'call' }),
        arguments: [
          TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'first' }),
          TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'second' }),
          TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'third' }),
        ],
      });

      const result = astGetCallFirstArgumentNameTransformer({ node });

      expect(result).toBe('first');
    });
  });
});
