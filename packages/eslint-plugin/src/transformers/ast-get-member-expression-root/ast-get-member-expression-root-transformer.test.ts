import { astGetMemberExpressionRootTransformer } from './ast-get-member-expression-root-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astGetMemberExpressionRootTransformer', () => {
  describe('single-level member expressions', () => {
    it("VALID: {expr: obj.prop} => returns 'obj'", () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'obj' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'prop' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('obj');
    });

    it("VALID: {expr: result.files} => returns 'result'", () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'result' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'files' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('result');
    });
  });

  describe('nested member expressions', () => {
    it("VALID: {expr: obj.prop.nested} => returns 'obj'", () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'obj' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'prop' }),
        }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'nested' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('obj');
    });

    it("VALID: {expr: result.user.name} => returns 'result'", () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'result' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'user' }),
        }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'name' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('result');
    });

    it("VALID: {expr: data.user.profile.avatar} => returns 'data'", () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          object: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'data' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'user' }),
          }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'profile' }),
        }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'avatar' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('data');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = astGetMemberExpressionRootTransformer({});

      expect(result).toBeNull();
    });

    it('EMPTY: {expr: undefined} => returns null', () => {
      const result = astGetMemberExpressionRootTransformer({});

      expect(result).toBeNull();
    });

    it('EMPTY: {expr: non-MemberExpression} => returns null', () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.Literal,
        value: 'foo',
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBeNull();
    });

    it('EDGE: {expr: MemberExpression with Identifier root} => returns identifier name', () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'root' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'property' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('root');
    });

    it('EDGE: {expr: MemberExpression with non-Identifier root} => returns null', () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: 123,
        }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'property' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBeNull();
    });

    it('EDGE: {expr: MemberExpression with object undefined} => returns null', () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: undefined,
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'property' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBeNull();
    });

    it('EDGE: {expr: Identifier with no name} => returns null', () => {
      const expr = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: undefined }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'property' }),
      });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBeNull();
    });
  });
});
