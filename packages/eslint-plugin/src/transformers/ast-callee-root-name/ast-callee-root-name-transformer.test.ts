import { astCalleeRootNameTransformer } from './ast-callee-root-name-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astCalleeRootNameTransformer', () => {
  describe('plain identifier callees', () => {
    it("VALID: {node: describe(...)} => returns 'describe'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'describe' }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('describe');
    });

    it("VALID: {node: it(...)} => returns 'it'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'it' }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('it');
    });

    it("VALID: {node: test(...)} => returns 'test'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'test' }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('test');
    });
  });

  describe('member expression callees', () => {
    it("VALID: {node: describe.each(...)} => returns 'describe'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'describe' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'each' }),
        }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('describe');
    });

    it("VALID: {node: it.only(...)} => returns 'it'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'it' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'only' }),
        }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('it');
    });

    it("VALID: {node: test.skip(...)} => returns 'test'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'test' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'skip' }),
        }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('test');
    });
  });

  describe('double call expression callees', () => {
    it("VALID: {node: describe.each(table)('name', fn)} => returns 'describe'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'describe' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'each' }),
          }),
        }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe('describe');
    });

    it("VALID: {node: it.each(table)('name', fn)} => returns 'it'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'it' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'each' }),
          }),
        }),
      });

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

    it('EDGE: {node: no callee} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: undefined,
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe(null);
    });

    it('EDGE: {node: callee is Literal} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'foo' }),
      });

      const result = astCalleeRootNameTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
