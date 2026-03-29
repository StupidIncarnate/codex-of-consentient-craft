import { astFindExpectCallTransformer } from './ast-find-expect-call-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astFindExpectCallTransformer', () => {
  describe('direct expect chains', () => {
    it('VALID: {node: expect(x).toBe()} => returns expect CallExpression', () => {
      const expectCallExpression = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'expect' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'x' })],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: expectCallExpression,
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'toBe' }),
        }),
      });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toStrictEqual(expectCallExpression);
    });
  });

  describe('.not chains', () => {
    it('VALID: {node: expect(x).not.toBe()} => returns expect CallExpression', () => {
      const expectCallExpression = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'expect' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'x' })],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: expectCallExpression,
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'not' }),
          }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'toBe' }),
        }),
      });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toStrictEqual(expectCallExpression);
    });
  });

  describe('.resolves chains', () => {
    it('VALID: {node: expect(x).resolves.toBe()} => returns expect CallExpression', () => {
      const expectCallExpression = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'expect' }),
        arguments: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'x' })],
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: expectCallExpression,
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'resolves' }),
          }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'toBe' }),
        }),
      });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toStrictEqual(expectCallExpression);
    });
  });

  describe('non-expect calls', () => {
    it('EMPTY: {node: foo.bar()} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'bar' }),
        }),
      });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {node: non-MemberExpression callee} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'fn' }),
      });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toBe(null);
    });

    it('EMPTY: {node: otherFn(x).toBe()} => returns null', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.CallExpression,
            callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'otherFn' }),
            arguments: [],
          }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'toBe' }),
        }),
      });

      const result = astFindExpectCallTransformer({ node });

      expect(result).toBe(null);
    });
  });
});
