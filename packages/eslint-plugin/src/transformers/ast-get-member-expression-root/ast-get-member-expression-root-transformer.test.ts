import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { astGetMemberExpressionRootTransformer } from './ast-get-member-expression-root-transformer';

describe('astGetMemberExpressionRootTransformer', () => {
  describe('single-level member expressions', () => {
    it("VALID: {expr: obj.prop} => returns 'obj'", () => {
      const expr = MemberExpressionStub({ code: 'obj.prop;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('obj');
    });

    it("VALID: {expr: result.files} => returns 'result'", () => {
      const expr = MemberExpressionStub({ code: 'result.files;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('result');
    });
  });

  describe('nested member expressions', () => {
    it("VALID: {expr: obj.prop.nested} => returns 'obj'", () => {
      const expr = MemberExpressionStub({ code: 'obj.prop.nested;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('obj');
    });

    it("VALID: {expr: result.user.name} => returns 'result'", () => {
      const expr = MemberExpressionStub({ code: 'result.user.name;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('result');
    });

    it("VALID: {expr: data.user.profile.avatar} => returns 'data'", () => {
      const expr = MemberExpressionStub({ code: 'data.user.profile.avatar;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('data');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns null', () => {
      const result = astGetMemberExpressionRootTransformer({});

      expect(result).toBe(null);
    });

    it('EMPTY: {expr: undefined} => returns null', () => {
      const result = astGetMemberExpressionRootTransformer({});

      expect(result).toBe(null);
    });

    it('EMPTY: {expr: non-MemberExpression} => returns null', () => {
      const expr = LiteralStub({ code: 'const l = "foo";' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe(null);
    });

    it('EDGE: {expr: MemberExpression with Identifier root} => returns identifier name', () => {
      const expr = MemberExpressionStub({ code: 'root.property;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe('root');
    });

    it('EDGE: {expr: MemberExpression with non-Identifier root} => returns null', () => {
      const expr = MemberExpressionStub({ code: '"text".length;' });

      const result = astGetMemberExpressionRootTransformer({ expr });

      expect(result).toBe(null);
    });
  });
});
